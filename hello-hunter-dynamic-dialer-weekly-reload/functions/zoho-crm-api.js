const axios = require('axios');

class ZohoCrmApi {
    constructor() {
        this.conn = axios.create({
            baseURL: 'https://www.zohoapis.com/crm/v5/',
            headers: { 'Content-Type': 'application/json' },
        });
    }

    async refreshAccessTokens() {
        const refreshUrl = `https://accounts.zoho.com/oauth/v2/token?refresh_token=${process.env.REFRESH_TOKEN}&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=refresh_token`;

        try {
            const refreshRequest = await axios.post(refreshUrl);
            const token = refreshRequest.data;

            if (!token || refreshRequest.status === 401 || token.status === 'failure') {
                console.error('Zoho CRM refresh Token not received');
                console.debug(refreshRequest.data);
                console.debug(refreshRequest.status);
                return;
            }

            console.info('Zoho CRM refresh Token received');
            this.conn.defaults.headers['Authorization'] = `Zoho-oauthtoken ${token.access_token}`;
        } catch (error) {
            console.error('Error refreshing Zoho CRM tokens:', error.message);
            if (error.response) {
                console.debug(error.response.data);
                console.debug(error.response.status);
            }
        }
    }

    async search(module, params) {
        try {
            const response = await this.apiCall(`${module}/search?criteria=${params}`, 'get');
            return response.data;
        } catch (error) {
            console.error('Error searching Zoho CRM:', error.message);
            return null;
        }
    }

    async coql(selectQuery) {
        return this.apiCall('coql', 'post', { select_query: selectQuery });
    }

    async zohoCrmPost(url, type, payload) {
        const payloadLen = payload.length;
        const numOfRequests = Math.ceil(payloadLen / 100);
        let startIndex = 0;
        let endIndex = payloadLen > 100 ? 99 : payloadLen - 1;
        const respArray = [];

        for (let iteration = 1; iteration <= numOfRequests; iteration++) {
            const data = { data: payload.slice(startIndex, endIndex + 1) };
            const apiResp = await this.apiCall(url, type, data);

            if (apiResp?.data) {
                respArray.push(apiResp.data);
            }

            startIndex += 100;
            endIndex = Math.min(startIndex + 99, payloadLen - 1);
        }

        return respArray;
    }

    async apiCall(url, type, payload = null) {
        try {
            const response = await this.conn.request({
                url,
                method: type,
                data: payload ? JSON.stringify(payload) : null,
            });

            switch (response.status) {
                case 200:
                case 201:
                case 202:
                    console.info(`Zoho ${type} to ${url} successful`);
                    return response.data;
                case 204:
                    console.info(`Zoho ${type} to ${url} successful`);
                    console.info(response.data);
                    return 'no data';
                default:
                    console.error(`Zoho ${type} to ${url} failed`);
                    console.debug(response.data);
                    console.debug(response.status);
                    return 'fail';
            }
        } catch (error) {
            console.error(`Error making API call to ${url}:`, error.message);
            if (error.response) {
                console.debug(error.response.data);
                console.debug(error.response.status);
            }
            return 'fail';
        }
    }
}

module.exports = ZohoCrmApi;