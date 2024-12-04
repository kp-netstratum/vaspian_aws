require 'faraday'
require 'uri'
require 'json'
require 'pry'
require 'logger'
require 'date'
require_relative 'helpers/hh'
require_relative 'helpers/z_crm'

def main()
  $logger = Logger.new($stdout)
  now_time = Time.new
  reload_date = now_time.strftime("%F")
  hh_api = HelloHunterApi.new
  hh_custs = hh_api.get_cust
  crm_api = CrmApi.new
  hh_query = {"select_query" => "select Account_Name, Hello_Hunter_Id, Threshold, Reload_Amount from Accounts where 'Auto_Reload' = 'true' and 'Hello_Hunter_Id' is not null ORDER BY Account_Name limit 200"}
  z_custs = crm_api.post('coql',hh_query)
  
  if z_custs != "fail"
    z_custs.each do |z_cust|
      z_hh_id = z_cust["Hello_Hunter_Id"].to_s
      reload_cust = hh_custs.select{|hh_cust| hh_cust["id"].to_s.include?(z_hh_id)}[0]
      cust_call_rate = reload_cust["call_rate"].to_f / 10000
      cust_min = reload_cust["available_minutes"].to_f
      balance = (cust_min * cust_call_rate / 60).round(0)
      cust_name = reload_cust["user_group_name"]
      cust_thresh = z_cust["Threshold"]
      reload_amnt = z_cust["Reload_Amount"]
      $logger.info("Customer: #{cust_name} Balance: $#{balance} Threshold $#{cust_thresh} Reload Amount: $#{reload_amnt}")
      
      if balance <= cust_thresh
        $logger.info("Below threshold. Need to reload.")
        hh_reload_resp = hh_api.give_credit(z_hh_id,reload_amnt)
        if hh_reload_resp == 200
          update_cust = {}
          update_cust["Account"] = z_cust["id"]
          update_cust["HH_Name"] = cust_name
          update_cust["New_Balance"] = balance + reload_amnt
          update_cust["Old_Balance"] = balance
          update_cust["Platform_Id"] = z_cust["Hello_Hunter_Id"]
          update_cust["Reload_Amount"] = reload_amnt
          update_cust["Reload_Date"] = reload_date
            
          payload = Array.new(1) {update_cust}
          reload_resp = crm_api.post_put("Voice_Dial_Reloads",payload,"/upsert")
          $logger.info(reload_resp)
          if reload_resp != 'fail'
            $logger.info(reload_resp[0][0]["message"])
          end
        end
      else
        $logger.info("Above threshold. Don't need to reload.")
      end
    end
  end
end

def lambda_handler(event:, context:)
  main()
end

main()
