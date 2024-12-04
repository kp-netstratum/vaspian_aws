class ZohoCrmApi
  attr_accessor :conn, :headers

  def initialize
    self.conn = Faraday.new 'https://www.zohoapis.com/crm/v5/'
    self.refresh_access_tokens
    self
  end

  def refresh_access_tokens
    refresh_url = "https://accounts.zoho.com/oauth/v2/token?refresh_token=#{ENV['REFRESH_TOKEN']}&client_id=#{ENV['CLIENT_ID']}&client_secret=#{ENV['CLIENT_SECRET']}&grant_type=refresh_token"
    refresh_request = @conn.post refresh_url
    token = JSON.parse(refresh_request.body)
    if token == nil || refresh_request.status == 401 || token['status'] == 'failure'
      $logger.error('Zoho CRM refresh Token not received')
      $logger.debug(refresh_request.body)
      $logger.debug(refresh_request.status)
    else
      $logger.info('Zoho CRM refresh Token received')
    end
    @conn.headers['Authorization'] = "Zoho-oauthtoken #{token['access_token']}"
  end

  def search(z_module, params)
    response = self.api_call("#{z_module}/search?criteria=#{params}", 'get')
    response['data']
  end

  def coql(select_query)
    self.api_call('coql', 'post', {select_query: select_query})
  end

  def zoho_crm_post(url, type, payload)
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

    for iteration in 1..num_of_requests do
      data = {data: payload[start_index..end_index]}
      api_resp = self.api_call(url, type, data)
      resp_array.append(api_resp['data'])
      start_index += 100
      end_index += 100
      next_iter = iteration + 1
      end_index = payload_len - 1 if next_iter == num_of_requests
    end
    resp_array
  end

  def api_call(url, type, payload = nil)
    json_payload = payload.nil? ? payload : JSON.generate(payload)
    $logger.info("#{url} #{json_payload}")
    response =
      case type
      when 'get' then @conn.get(url,json_payload)
      when 'post' then @conn.post(url,json_payload)
      when 'put' then @conn.put(url,json_payload)
      end
    
    $logger.info
    case response.status
    when 200, 201, 202
      data = JSON.parse(response.body)
      $logger.info("Zoho #{type} to #{url} successful")
      return data
    when 204
      $logger.info("Zoho #{type} to #{url} successful")
      $logger.info(response.body)
      return 'no data'
    else
      $logger.error("Zoho #{type} to #{url} failed")
      $logger.debug(response.body)
      $logger.debug(response.status)
      return 'fail'
    end
  end
end
