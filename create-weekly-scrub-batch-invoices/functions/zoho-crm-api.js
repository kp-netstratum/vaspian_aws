const axios = require('axios');
require('dotenv').config();

class ZohoCrmApi {
    constructor() {
        this.baseUrl = 'https://www.zohoapis.com/crm/v2/';
        this.headers = {
            'Authorization': `Zoho-oauthtoken ${process.env.CRM_ACCESS_TOKEN}`
        };
    }


    async refreshAccessTokens() {
        const refreshUrl = `https://accounts.zoho.com/oauth/v2/token?refresh_token=${process.env.REFRESH_TOKEN}&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=refresh_token`;

        try {
            const response = await axios.post(refreshUrl);
            const token = response.data;

            if (!token || response.status === 401 || token.status === 'failure') {
                console.error('Zoho CRM refresh token not received');
                console.debug(response.data);
                console.debug(response.status);
            } else {
                console.info('Zoho CRM refresh token received');
                this.headers['Authorization'] = `Zoho-oauthtoken ${token.access_token}`;
            }
        } catch (error) {
            console.error('Error refreshing access tokens', error.message);
        }
    }

    async search(zModule, params) {
        const response = this.api_call(`${zModule}/search?criteria=${params}`, 'get');
        return response.data;
    }

    async coql(selectQuery) {
        const response = this.api_call('coql', 'post', { query: selectQuery });
        return response.data;
    }

    async zohoCrmPost(url, type, payload) {
        const payloadLen = payload.length;
        const numOfRequests = Math.ceil(payloadLen / 100);
        let startIndex = 0;
        let endIndex = Math.min(payloadLen - 1, 99);
        const respArray = [];

        for (let iteration = 1; iteration <= numOfRequests; iteration++) {
            const data = { data: payload.slice(startIndex, endIndex + 1) };
            const apiResp = await this.apiCall(url, type, data);
            respArray.push(apiResp.data);
            startIndex += 100;
            endIndex = Math.min(startIndex + 99, payloadLen - 1);
        }

        return respArray;
    }

    async apiCall(url, type, payload = null) {
        const jsonPayload = payload ? JSON.stringify(payload) : null;
        const fullUrl = `${this.baseUrl}${url}`;

        console.info(`${fullUrl} ${jsonPayload}`);
        try {
            let response;
            switch (type) {
                case 'get':
                    response = await axios.get(fullUrl, { headers: this.headers, params: payload });
                    break;
                case 'post':
                    response = await axios.post(fullUrl, jsonPayload, { headers: this.headers });
                    break;
                case 'put':
                    response = await axios.put(fullUrl, jsonPayload, { headers: this.headers });
                    break;
                default:
                    throw new Error(`Unsupported request type: ${type}`);
            }
            if ([200, 201, 202].includes(response.status)) {
                console.info(`Zoho ${type} to ${url} successful`);
                return response.data;
            } else if (response.status === 204) {
                console.info(`Zoho ${type} to ${url} successful. No data returned.`);
                return 'no data';
            }
        } catch (error) {
            console.error(`Zoho ${type} to ${url} failed`);
            console.debug(error.response.status);
            console.debug(error.response.data);
            return 'fail';
        }
    }
}

module.exports = ZohoCrmApi;