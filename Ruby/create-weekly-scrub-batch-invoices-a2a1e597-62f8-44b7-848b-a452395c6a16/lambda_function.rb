require 'faraday'
require 'dotenv/load'
require_relative 'helpers/zoho-crm-api.rb'
require_relative 'helpers/zoho-books-api.rb'

$logger = Logger.new($stdout)
$crm_api = ZohoCrmApi.new
$yesterday_date = Date.today - 1
$yesterday = $yesterday_date.strftime("%F")
$inv_date = Date.today.strftime("%F")

def lambda_handler(event:, context:)
  batch_search = "(((Scrub_Date:equals:#{$yesterday})and(Invoiced:equals:false))and(Account:not_equal:null))"
  z_scrubs = $crm_api.search('Scrub_File_Batches', batch_search)
  if z_scrubs.is_a?(Array) && z_scrubs.count > 0 #is_a -> to check type
    $books_api = ZohoBooksApi.new
    scrubs_grouped = z_scrubs.group_by { |i| i['Account']['id'] }
    $logger.info("Number of Invoices to create: #{scrubs_grouped.count}") #to print
    inv_temp = set_inv_temp() #set_inv_temp function called
    scrubs_grouped.each do |key,scrubs|
      create_invoice_response = create_invoice(key,scrubs,Hash.new.merge(inv_temp)) #create invloice function called
      if !create_invoice_response.nil? && create_invoice_response['message'] == 'The invoice has been created.'
        update_scrub_records(scrubs,create_invoice_response['invoice']) #update function called
      else
        $logger.error("Invoice did not generate for #{key}")
      end
    end
  else
    $logger.info('No scrub batches to invoice')
    $logger.info(z_scrubs)
  end
end

def set_inv_temp()
  inv_temp = {'allow_partial_payments' => true}
  custom_fields = Array.new
  custom_fields.append({'api_name' => 'cf_service_type', 'value' => 'Number Scrubbing'})
  custom_fields.append({'api_name' => 'cf_billing_cycle', 'value' => 'One Time'})
  inv_temp['custom_fields'] = custom_fields
  inv_temp['date'] = $inv_date
  authorize_net = {'gateway_name' => 'authorize_net', 'configured' => true}
  inv_temp['payment_options'] = {'payment_gateways' => [authorize_net]}
  inv_temp['payment_terms_label'] = 'Due on Receipt'
  inv_temp['template_id'] = 1743789000009974029
  inv_temp
end

#function to create invoice in Zoho Books
def create_invoice(key,scrubs,invoice_hash)
  books_contact = $books_api.books_contact_from_crm_id(key)  #get contects in Books from zoho crm ID
  books_contact_id = books_contact['contact_id']
  invoice_hash['customer_id'] = books_contact_id.to_i
  invoice_hash['contact_persons'] = get_contact_persons(key,books_contact_id)
  invoice_hash['line_items'] = set_line_items(scrubs)
  create_invoice_response = $books_api.api_call('invoices','post',invoice_hash)
  create_invoice_response
end

def get_contact_persons(crm_id,books_contact_id)
  contacts_query = "((Email_Invoices:equals:true)and(Account_Name:equals:#{crm_id}))"
  z_contacts = $crm_api.search('Contacts',contacts_query)
  b_contact_persons = $books_api.api_call("contacts/#{books_contact_id}/contactpersons","get")
  contact_persons = b_contact_persons['contact_persons']
  crm_contact_emails = z_contacts.map {|value| value['Email']}.compact
  contacts = contact_persons.select {|contact| crm_contact_emails.include?(contact['email'])}
  contact_ids = contacts.map {|value| value['contact_person_id']}
  contact_ids
end

def set_line_items(scrubs)
  line_items = Array.new
  line_item_temp = {'item_id' => 1743789000010144005}
  line_item_temp['rate'] = 0.004
  scrubs.each do |scrub|
    line_item = Hash.new.merge(line_item_temp)
    line_item['description'] = "Date: #{$yesterday} Transactions: #{scrub['Transactions']} Removed: #{scrub["Removed"]}"
    line_item['quantity'] = scrub['Transactions']
    line_items.append(line_item)
  end
  line_items
end

def update_scrub_records(scrubs,invoice_response)
    update_scrub_hash_temp = {'Invoiced' => true}
    update_scrub_hash_temp['Invoice_Id'] = invoice_response['invoice_id']
    update_scrub_hash_temp['Invoice_Number'] = invoice_response['invoice_number']
    update_scrubs = Array.new
  scrubs.each do |scrub|
    update_scrub_hash = Hash.new.merge(update_scrub_hash_temp)
    update_scrub_hash['id'] = scrub['id']
    update_scrubs.append(update_scrub_hash)
  end

  update_response = $crm_api.zoho_crm_post('Scrub_File_Batches/upsert','post',update_scrubs)
  scrub_update = ' not '
  if !update_response.nil? && update_response.count == scrubs.count && update_response[0][0]['message'] == 'record updated'
    scrub_update = ' '
  end
  $logger.info("Scrub batch records#{scrub_update}updated as invoiced")
  update_response
end
