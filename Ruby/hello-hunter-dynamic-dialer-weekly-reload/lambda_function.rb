require 'faraday'
require 'dotenv/load'
require_relative 'helpers/zoho-crm-api'
require_relative 'helpers/hh-api'

$logger = Logger.new($stdout)
$crm_api = ZohoCrmApi.new
$reload_date = Date.today.strftime("%F")
$hh_api = HelloHunterApi.new

def lambda_handler(event:, context:)
  accounts_query = '(((Dialer_Package:equals:Dynamic Dialer)and(Hello_Hunter_Id:not_equal:null))and(Weekly_Reload_Amount:not_equal:null))'
  z_custs = $crm_api.search('Accounts',accounts_query)
  if z_custs.is_a?(Array) && z_custs.count > 0
    hh_custs = $hh_api.get_cust
    process_customers(z_custs,hh_custs)
  end
end

def process_customers(z_custs,hh_custs)
  z_custs.each do |z_cust|
    z_hh_id = z_cust['Hello_Hunter_Id'].to_s
    reload_cust = hh_custs.select{|hh_cust| hh_cust['id'].to_s.include?(z_hh_id)}[0]
    if !reload_cust.nil?
      cust_call_rate = reload_cust['call_rate'].to_f / 10000
      cust_min = reload_cust['available_minutes'].to_f
      balance = (cust_min * cust_call_rate / 60).round(0)
      cust_name = reload_cust['user_group_name']
      reload_amnt = z_cust['Weekly_Reload_Amount']
      $logger.info("Customer: #{cust_name} Balance: $#{balance} Reload Amount: $#{reload_amnt}")
      hh_reload_resp = $hh_api.give_credit(z_hh_id,reload_amnt)
      if hh_reload_resp == 200
        update_customer(z_cust,cust_name,balance,reload_amnt)
      end
    end
  end
end

def update_customer(z_cust,cust_name,balance,reload_amnt)
  update_cust = {'Account' => z_cust['id']}
  update_cust['HH_Name'] = cust_name
  update_cust['Load_Type'] = 'Dynamic Weekly Load'
  update_cust['New_Balance'] = balance + reload_amnt
  update_cust['Old_Balance'] = balance
  update_cust['Platform_Id'] = z_cust['Hello_Hunter_Id']
  update_cust['Reload_Amount'] = reload_amnt
  update_cust['Reload_Date'] = $reload_date

  payload = Array.new(1) {update_cust}
  reload_resp = $crm_api.zoho_crm_post('Voice_Dial_Reloads/upsert','post',payload)
  $logger.info(reload_resp)
  if reload_resp != 'fail'
    $logger.info(reload_resp[0][0]['message'])
  end
end
