require 'faraday'
require 'dotenv/load'
require_relative 'helpers/hello-hunter-api'
require_relative 'helpers/zoho-crm-api'

$logger = Logger.new($stdout)

def lambda_handler(event:, context:)
  z_custs = init_z_client
  hh_custs = init_hh_client
  process_customers(z_custs,hh_custs)
end

def init_hh_client
  $hh_api = HelloHunterApi.new
  hh_custs = $hh_api.customers
  hh_custs
end

def init_z_client
  $crm_api = ZohoCrmApi.new
  hh_query = "select Account_Name, Hello_Hunter_Id, Threshold, Reload_Amount from Accounts where 'Auto_Reload' = 'true' and 'Hello_Hunter_Id' is not null ORDER BY Account_Name limit 200"
  z_custs = $crm_api.coql(hh_query)['data']
  z_custs
end

def process_customers(z_custs,hh_custs)
  now_time = Time.new
  reload_date = now_time.strftime("%F")
  if z_custs != "fail"
    z_custs.each do |z_cust|
      $logger.info("Processing Customer: #{z_cust}")
      z_hh_id = z_cust['Hello_Hunter_Id'].to_s
      reload_cust = hh_custs.select{|hh_cust| hh_cust["id"].to_s.include?(z_hh_id)}[0]
      cust_call_rate = reload_cust['call_rate'].to_f / 10000
      cust_min = reload_cust['available_minutes'].to_f
      balance = (cust_min * cust_call_rate / 60).round(0)
      cust_name = reload_cust['user_group_name']
      cust_thresh = z_cust['Threshold']
        reload_amnt = z_cust['Reload_Amount']
      $logger.info("Customer: #{cust_name} Balance: $#{balance} Threshold $#{cust_thresh} Reload Amount: $#{reload_amnt}")

      if balance <= cust_thresh
        $logger.info("Below threshold. Need to reload.")
        hh_reload_resp = $hh_api.give_credit(z_hh_id,reload_amnt)
        if hh_reload_resp == 200
          $logger.info("Reloaded #{reload_amnt} to #{cust_name}")
          create_reload_record_crm(z_cust,reload_amnt,balance,reload_date,cust_name)
        else
          $logger.error("Failed to reload #{reload_amnt} to #{cust_name}")
        end
      else
        $logger.info("Above threshold. Don't need to reload")
      end
    end
  end
end

def create_reload_record_crm(z_cust,reload_amnt,balance,reload_date,cust_name)
  update_cust = {}
  update_cust['Account'] = z_cust['id']
  update_cust['HH_Name'] = cust_name
  update_cust['New_Balance'] = balance + reload_amnt
  update_cust['Old_Balance'] = balance
  update_cust['Platform_Id'] = z_cust['Hello_Hunter_Id']
  update_cust['Reload_Amount'] = reload_amnt
  update_cust['Reload_Date'] = reload_date

  payload = Array.new(1) {update_cust}
  $logger.info(payload)
  reload_resp = $crm_api.zoho_crm_post('Voice_Dial_Reloads', payload, '/upsert')
  $logger.info(reload_resp)
  if reload_resp != 'fail'
  $logger.info(reload_resp[0][0]['message'])
  end
end

def main
  lambda_handler(event: nil, context: nil)
end

main()
