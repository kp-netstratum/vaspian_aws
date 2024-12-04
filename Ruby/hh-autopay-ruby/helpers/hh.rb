require 'json'
class HelloHunterApi
  attr_accessor :conn, :token, :response
  
  def initialize
    self.conn = Faraday.new(
      url: 'https://SQL-04.dialer.rocks/a/v1/resellers/',
      params: nil, 
      headers: {'Content-Type' => 'application/json'}
    )
    self.connect
    self
  end
  
  def connect
    creds = {name: ENV['HH_USERNAME'], pass: ENV['HH_PASSWORD']}
    request = @conn.post('login.json', creds.to_json)
    @response = JSON.parse(request.body)
    if request.status == 200
      $logger.info('Hello Hunter login successful')
      @token = @response['token']
    else
      $logger.error('Hello Hunter Token not received')
      $logger.debug(@response.body)
      $logger.debug(@response.status)
    end
  end
  
  def get_cust
    customers = @response['user_groups']
    $logger.info("Retrieving HH customers: #{customers.size} customers")
    customers
  end
  
  def give_credit(z_hh_id, reload_amount)
    params = {user_group_id: z_hh_id, to_add: reload_amount}
    response = @conn.put("add_balance.json?token=#{@token}", params.to_json)
    if response.status == 200
      $logger.info("Reload api call success. Amount added #{response["amount"]}")
      return response.status
    else 
      $logger.error("Hello Hunter reload of $#{reload_amount} failed for #{z_hh_id}")
      $logger.debug(response.body)
      $logger.debug(response.status)
      return nil
    end
  end
end