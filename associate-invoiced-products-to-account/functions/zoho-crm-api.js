const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

class ZohoCrmApi {
    constructor() {
        this.access_token = this.refreshAccessTokens(process.env.CRM_REFRESH_TOKEN);
        this.conn = axios.create({
            baseURL: 'https://www.zohoapis.com/crm/v5/',
            headers: {
                'Authorization': `Zoho-oauthtoken ${this.access_token}`
            }
        });
    }

    // Refresh access token
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

    // General API call function
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

    // Search function to search CRM modules
    async search(zModule, params) {
        const response = await this.apiCall(`${zModule}/search?criteria=${params}`, 'get');
        return response;
    }

    // CoQL query function
    async coql(selectQuery) {
        const response = await this.apiCall('coql', 'post', { select_query: selectQuery });
        return response;
    }

    // Post data in batches if payload is large
    async zohoCrmPost(url, type, payload) {
        const payloadLen = payload.length;
        const numOfRequests = Math.ceil(payloadLen / 100);
        let startIndex = 0;
        let endIndex = payloadLen > 100 ? 99 : payloadLen - 1;
        const respArray = [];

        for (let iteration = 1; iteration <= numOfRequests; iteration++) {
            const data = { data: payload.slice(startIndex, endIndex + 1) };
            const apiResp = await this.apiCall(url, type, data);
            respArray.push(apiResp.data);
            startIndex += 100;
            endIndex = iteration === numOfRequests ? payloadLen - 1 : endIndex + 100;
        }

        return respArray;
    }
}

module.exports = ZohoCrmApi;
