class ZohoCrmApi
  attr_accessor :conn, :headers

  def initialize
    access_token = self.refresh_access_tokens
    self.conn = Faraday.new 'https://www.zohoapis.com/crm/v5/' do |builder|
      builder.request :authorization , 'Zoho-oauthtoken', -> {access_token}
      builder.request :json
      builder.response :json
      builder.response :raise_error
      builder.response :logger
    end
    self
  end

  def refresh_access_tokens
    refresh_url = "https://accounts.zoho.com/oauth/v2/token?refresh_token=#{ENV['CRM_REFRESH_TOKEN']}&client_id=#{ENV['CLIENT_ID']}&client_secret=#{ENV['CLIENT_SECRET']}&grant_type=refresh_token"
    begin
      refresh_request = Faraday.post refresh_url
      refresh_json = JSON.parse(refresh_request.body)
      token = refresh_json['access_token']
      $logger.info('Zoho access Token received')
    rescue Faraday::Error => e
      $logger.error('Zoho access Token not received')
      $logger.debug e.response[:status]
      $logger.debug e.response[:body]
    end
    token
  end

  def search(z_module, params)
    self.api_call("#{z_module}/search?criteria=#{params}", 'get')
  end

  def coql(select_query)
    self.api_call('coql', 'post', {select_query: select_query})
  end

  def zoho_crm_post(url, payload, type = "")
    payload_len = payload.length
    num_of_requests = (payload_len.to_f / 100 ).ceil
    start_index = 00
    end_index =
      if payload_len > 100
        99
      else
        payload_len - 1
      end
    resp_array = []
    post_url = type == 'upsert' ? "#{url}/#{type}" : url
    for iteration in 1..num_of_requests do
      data = {data: payload[start_index..end_index]}
      api_resp = self.api_call(url, "post", data)
      resp_array.append(api_resp['data'])
      start_index += 100
      end_index += 100
      next_iter = iteration + 1
      end_index = payload_len - 1 if next_iter == num_of_requests
    end
    resp_array
  end

  def api_call(url, type, payload = nil)
    begin
      response =
        case type
        when 'get' then @conn.get(url,payload)
        when 'post' then @conn.post(url,payload)
        when 'put' then @conn.put(url,payload)
        when 'delete' then @conn.delete(url,payload)
        end
      $logger.info response
      data = response.body
      $logger.info data
      $logger.info("Zoho #{type} to #{url} successful")
      return data
    rescue Faraday::Error => e
      $logger.error("Zoho #{type} to #{url} failed")
      $logger.debug e.response[:status]
      $logger.debug e.response[:body]
      return 'fail'
    end
  end
end
