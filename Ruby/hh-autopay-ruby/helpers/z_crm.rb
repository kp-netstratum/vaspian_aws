class CrmApi
  attr_accessor :retrieval_time, :conn

  def initialize
    self.conn = Faraday.new 'https://www.zohoapis.com/crm/v3/'
    self.refresh_token
    self
  end
  
  def refresh_token
    ref_url = "https://accounts.zoho.com/oauth/v2/token?refresh_token=#{ENV['REFRESH_TOKEN']}&client_id=#{ENV['CLIENT_ID']}&client_secret=#{ENV['CLIENT_SECRET']}&grant_type=refresh_token"
    response = @conn.post(ref_url)
    token = JSON.parse(response.body)
    
    if token && response.status == 200
      $logger.info('Zoho refresh Token received')
      @conn.headers['Authorization'] = "Zoho-oauthtoken #{token['access_token']}"
    else
      $logger.error('Zoho refresh Token not received')
      $logger.debug(response.body)
      $logger.debug(response.status)
    end
    self.retrieval_time = Time.now.strftime "%H:%M"
  end

  def search(z_module, params)
    url = "#{z_module}/search?criteria=#{params}"
    response = @conn.get(url,nil)
    if response == 200
      data = JSON.parse(response.body)
      $logger.info('Zoho search record returned data')
      return data['data']
    else
      $logger.info('Zoho search record returned no data')
      $logger.debug(response.body)
      $logger.debug(response.status)
      return []
    end
  end

  def post_put(z_module, payload, post_type='')
    api_url = "#{z_module}#{post_type}"
    payload_length = payload.length
    num_of_req = (payload_length.to_f / 100 ).ceil 
    start_ind = 00
    end_ind =
      if payload_length > 100
        99
      else
        payload_length - 1
      end
    resp_array = []
    for iteration in 1..num_of_req do
      data_hash = {data: payload[start_ind..end_ind]}
      post_resp = post(api_url, data_hash)
      resp_array.append(post_resp)
      start_ind += 100
      end_ind += 100
      next_iter = iteration + 1
      end_ind = payload_len - 1 if next_iter == num_of_req
    end
    resp_array
  end

  def post(url, payload)
    response = @conn.post(url, payload.to_json)
    case response.status
    when 200, 201, 202, 204
      data = JSON.parse(response.body)
      $logger.info('Zoho post successful')
      return data['data']
    else
      $logger.error('Zoho post failed')
      $logger.debug(response.body)
      $logger.debug(response.status)
      return 'fail'
    end
  end
end