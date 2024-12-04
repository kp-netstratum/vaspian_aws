require_relative 'zoho'

class ZohoAnalyticsApi < Zoho
  attr_accessor :conn

  def initialize
    access_token = self.refresh_access_tokens(ENV['ANALYTICS_REFRESH_TOKEN'])
    self.conn = Faraday.new 'https://analyticsapi.zoho.com/restapi/v2/' do |builder|
      builder.request :authorization , 'Zoho-oauthtoken', -> {access_token}
      builder.request :json
      builder.response :json
      builder.response :raise_error
      builder.response :logger
    end
    @conn.headers['ZANALYTICS-ORGID'] = ENV['ANALYTICS_ORG_ID']
    self
  end

  def export(view, type)
    config = {'CONFIG': {'responseFormat': type}}
    response = self.api_call("workspaces/#{ENV['ANALYTICS_WORKSPACE_ID']}/views/#{view}/data", 'get', config)
    response
  end

  def create_export(view, type)
    config = {'CONFIG': {'responseFormat': type}}
    response = self.api_call("bulk/workspaces/#{ENV['ANALYTICS_WORKSPACE_ID']}/views/#{view}/data", 'get', config)
    return response['status'] == 'success' ? response : 'fail'
  end

  def get_export_details(job_id)
    response = self.api_call("bulk/workspaces/#{ENV['ANALYTICS_WORKSPACE_ID']}/exportjobs/#{job_id}", 'get')
    return response
  end

  def download_exported_data(job_id)
    response = self.api_call("bulk/workspaces/#{ENV['ANALYTICS_WORKSPACE_ID']}/exportjobs/#{job_id}/data", 'get')
    return response
  end
end
