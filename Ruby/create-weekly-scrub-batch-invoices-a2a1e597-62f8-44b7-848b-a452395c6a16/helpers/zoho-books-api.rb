class ZohoBooksApi
  attr_accessor :conn, :headers

  def initialize
    self.conn = Faraday.new 'https://www.zohoapis.com/books/v3/'
    self.refresh_access_tokens
    self
  end

  def refresh_access_tokens
    refresh_url = "https://accounts.zoho.com/oauth/v2/token?refresh_token=#{ENV['BOOKS_REFRESH_TOKEN']}&client_id=#{ENV['CLIENT_ID']}&client_secret=#{ENV['CLIENT_SECRET']}&grant_type=refresh_token"
    refresh_request = @conn.post refresh_url
    token = JSON.parse(refresh_request.body)
    if token == nil || refresh_request.status == 401
      $logger.error('Zoho Books access token not received')
      $logger.debug(refresh_request.status)
    else
      $logger.info('Zoho Books access token received')
    end
    @conn.headers['Authorization'] = "Zoho-oauthtoken #{token['access_token']}"
    @conn.headers['content-type'] = 'application/json'
  end

  def books_contact_from_crm_id(id)
    payload = {'zcrm_account_id' => id}
    books_contact = api_call('contacts','get',payload)
    books_contact['contacts'][0]
  end

  def api_call(url, type, payload = nil)
    url_w_org = "#{url}?organization_id=#{ENV['BOOKS_ORG_ID']}"
    response =
      case type
      when 'get' then @conn.get(url_w_org,payload)
      when 'post' then @conn.post(url_w_org,JSON.generate(payload))
      when 'put' then @conn.put(url_w_org,payload)
      end
      
    
    case response.status
    when 200, 201
      data = JSON.parse(response.body)
      if data['code'] = 0
        $logger.info("Books #{type} to #{url} successful")
      else
        $logger.error("Books #{type} to #{url} message #{data['message']}")
      end
      return data
    when 204
      $logger.info("Zoho #{type} to #{url} successful. No data returned.")
      $logger.info(response.body)
      return 'no data'
    else
      $logger.error("Books #{type} to #{url} failed")
      $logger.debug(response.status)
      $logger.debug(response.body)
      response
    end
  end
end
