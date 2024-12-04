require_relative 'zoho'

class ZohoCrmApi < Zoho
  attr_accessor :conn

  def initialize
    access_token = self.refresh_access_tokens(ENV['CRM_REFRESH_TOKEN'])
    self.conn = Faraday.new 'https://www.zohoapis.com/crm/v5/' do |builder|
      builder.request :authorization , 'Zoho-oauthtoken', -> {access_token}
      builder.request :json
      builder.response :json
      builder.response :raise_error
      builder.response :logger
    end
    self
  end

  def search(z_module, params)
    response = self.api_call("#{z_module}/search?criteria=#{params}", 'get')
    response
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
end
