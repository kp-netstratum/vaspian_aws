require 'faraday'
require 'dotenv/load'
require 'pry'
require 'csv'
require_relative 'helpers/zoho-crm-api'
require_relative 'helpers/zoho-analytics-api'

$logger = Logger.new($stdout)
$crm_api = ZohoCrmApi.new
$analytics_api = ZohoAnalyticsApi.new
$inv_date = Date.today.strftime("%F")

def lambda_handler(event:, context:)
  products_to_associate = get_products_to_associate
  products_grouped = parse_csv(products_to_associate)
  accounts = products_grouped.keys
  different_products = process_accounts(accounts, products_grouped)
  $logger.info("Process finished")
end

def get_products_to_associate
  analytics_csv = $analytics_api.create_export('1229105000014484012', 'csv')
  job_id = analytics_csv['data']['jobId']
  $logger.info("Analytics CSV: #{analytics_csv}")
  job_complete = 'in progress'
  until job_complete == 'success'
    sleep 2
    job_details = $analytics_api.get_export_details(job_id)
    job_complete = job_details['status']
  end
  return $analytics_api.download_exported_data(job_id)

end

def parse_csv(csv)
  csv_array = CSV.parse(csv)
  csv_array.shift
  data_grouped = csv_array.group_by { |i| i.shift }.transform_values do |values|
    values.flatten
  end
  data_grouped
end

def process_accounts(accounts, analytics_products_grouped)
  $logger.info("Analytics Products Grouped: #{analytics_products_grouped}")
  num_account_processed = 0
  analytics_to_add = false
  accounts.each do |account_id|
    products = {'add'=>[], 'remove'=>[]}
    crm_products_resp = get_crm_related_records('Accounts', account_id, 'Products')
    if crm_products_resp
      crm_products = crm_products_resp['data']
      if crm_products.size() != 0
        $logger.info("CRM Products: #{crm_products}")
        if analytics_products_grouped[account_id]
          compare_products_response = compare_products(crm_products, analytics_products_grouped[account_id])
          products['add'] = compare_products_response['add']
          products['remove'] = compare_products_response['remove']
        else
          $logger.info("We are removing all products from CRM Account.")
          crm_products.each { |product| products['remove'] << product['id'] }
        end
      else
        analytics_to_add = true
      end
    else
      analytics_to_add = true
    end
    if analytics_to_add && analytics_products_grouped[account_id] && analytics_products_grouped[account_id].size() > 0
      products['add'] = analytics_products_grouped[account_id]
    end
    $logger.info("Products being changed: #{products}")
    determine_action(products, account_id)
    num_account_processed += 1
  end
  $logger.info("Number of accounts processed: #{num_account_processed}")
end

def compare_products(crm_products, analytics_products_grouped)
  products_to_add = []
  products_to_remove = []
  $logger.info "Analytics Products Grouped: #{analytics_products_grouped}"
  crm_products.each do |c_product|
    c_product_id = c_product['id']
    has_product = analytics_products_grouped.any? { |a_item| a_item = c_product_id }
    $logger.info("Has Product: #{has_product}")
    if has_product
      analytics_products_grouped = analytics_products_grouped.select { |a_product| a_product = c_product_id }
    else
      products_to_remove << c_product_id
    end
  end
  $logger.info("We Are removing the following products: #{products_to_remove}")
  analytics_products_grouped.each { |a_product| products_to_add << a_product }
  {'add'=> products_to_add, 'remove'=> products_to_remove}
end

def get_crm_related_records(parent, parent_id, child)
  crm_products = $crm_api.api_call("#{parent}/#{parent_id}/#{child}?fields=Owner,Parent_Id",'get')
  crm_products
end

def determine_action(products, account_id)
  if !products['add'].nil? && products['add'].size() != 0
    products_to_add = []
    products['add'].each { |product| products_to_add.push({'id'=>product}) }
    add_related_products('Accounts', account_id, 'Products', products_to_add)
  else
    $logger.info('No products to add')
  end
  if !products['remove'].nil? && products['remove'].size() != 0
    remove_ids = []
    products['remove'].each { |record|
      $logger.info("Record being removed: #{record}")
      remove_ids.push(record)
    }
    remove_ids = remove_ids.join(',')
    $logger.info("Remove IDs: #{remove_ids}")
    remove_related_products('Accounts', account_id, 'Products', remove_ids)
  else
    $logger.info('No products to remove')
  end
end

def add_related_products(parent, parent_id, child, records)
  $logger.info("Records being associated: #{records}")
  crm_products = $crm_api.zoho_crm_post("#{parent}/#{parent_id}/#{child}",'put', records)
end

def remove_related_products(parent, parent_id, child, records)
  $logger.info "Records being disassociated: #{records}"
  $logger.info "Api call: #{parent}/#{parent_id}/#{child}?ids=#{records}"
  crm_products = $crm_api.api_call("#{parent}/#{parent_id}/#{child}?ids=#{records}",'delete')
end

lambda_handler(event: nil, context: nil)
