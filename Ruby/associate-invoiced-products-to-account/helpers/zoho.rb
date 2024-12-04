class Zoho
  def refresh_access_tokens(refresh_token)
    refresh_url = "https://accounts.zoho.com/oauth/v2/token?refresh_token=#{refresh_token}&client_id=#{ENV['CLIENT_ID']}&client_secret=#{ENV['CLIENT_SECRET']}&grant_type=refresh_token"
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

  def api_call(url, type, payload = nil)
    begin
      response =
        case type
        when 'get' then @conn.get(url,payload)
        when 'post' then @conn.post(url,payload)
        when 'put' then @conn.put(url,payload)
        when 'delete' then @conn.delete(url,payload)
        end
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
