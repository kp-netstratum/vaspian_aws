
class HelloHunterApi
  attr_accessor :conn, :token, :response, :customers

  def initialize
    self.conn = Faraday.new "https://SQL-04.dialer.rocks/a/v1/resellers/" do |builder|
      builder.request :json
      builder.response :json
      builder.response :raise_error
      builder.response :logger
      builder.headers['Content-Type'] = 'application/json'
    end
    self.connect
    self
  end

  def connect
    creds = {name: ENV['HH_USERNAME'], pass: ENV['HH_PASSWORD']}
    begin
      response = @conn.post('login.json', creds.to_json)
      response_body = response.body
      @token = response_body['token']
      @customers = response_body['user_groups']
      $logger.info('Hello Hunter login successful')
    rescue Faraday::Error => e
      $logger.error('Hello Hunter Token not received')
      $logger.debug e.response[:status]
      $logger.debug e.response[:body]
    end
  end

  def give_credit(z_hh_id, reload_amount)
    params = {user_group_id: z_hh_id, to_add: reload_amount}
    begin
      response = @conn.put("add_balance.json?token=#{@token}", params.to_json)
      $logger.info("Reload api call success. Amount added #{response['amount']}")
      return response.status
    rescue Faraday::Error => e
      $logger.error("Hello Hunter reload of $#{reload_amount} failed for #{z_hh_id}")
      $logger.debug e.response[:status]
      $logger.debug e.response[:body]
      return nil
    end
  end
end
