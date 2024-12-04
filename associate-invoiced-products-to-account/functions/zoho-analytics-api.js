const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

class ZohoAnalyticsApi {
    constructor() {
        this.access_token = this.refreshAccessTokens(process.env.ANALYTICS_REFRESH_TOKEN);
        this.conn = axios.create({
            baseURL: 'https://analyticsapi.zoho.com/restapi/v2/',
            headers: {
                'Authorization': `Zoho-oauthtoken ${this.access_token}`,
                'ZANALYTICS-ORGID': process.env.ANALYTICS_ORG_ID
            }
        });
    }

    async refreshAccessTokens(refreshToken) {
        try {
            const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
                params: {
                    refresh_token: refreshToken,
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET,
                    grant_type: 'refresh_token'
                }
            });
            if (response.data.access_token) {
                return response.data.access_token;
            } else {
                throw new Error('Failed to get access token');
            }
        } catch (error) {
            console.error('Error refreshing access token:', error);
            throw error;
        }
    }

    async apiCall(endpoint, method, config = {}) {
        try {
            const response = await this.conn({
                url: endpoint,
                method: method,
                ...config
            });
            return response.data;
        } catch (error) {
            console.error(`Error making API call to ${endpoint}:`, error);
            throw error;
        }
    }

    async export(view, type) {
        const config = {
            params: {
                'CONFIG': {
                    'responseFormat': type
                }
            }
        };
        return await this.apiCall(`workspaces/${process.env.ANALYTICS_WORKSPACE_ID}/views/${view}/data`, 'get', config);
    }

    async createExport(view, type) {
        const config = {
            params: {
                'CONFIG': {
                    'responseFormat': type
                }
            }
        };
        const response = await this.apiCall(`bulk/workspaces/${process.env.ANALYTICS_WORKSPACE_ID}/views/${view}/data`, 'get', config);
        return response.status === 'success' ? response : 'fail';
    }

    async getExportDetails(jobId) {
        return await this.apiCall(`bulk/workspaces/${process.env.ANALYTICS_WORKSPACE_ID}/exportjobs/${jobId}`, 'get');
    }

    async downloadExportedData(jobId) {
        return await this.apiCall(`bulk/workspaces/${process.env.ANALYTICS_WORKSPACE_ID}/exportjobs/${jobId}/data`, 'get');
    }
}

module.exports = ZohoAnalyticsApi;
