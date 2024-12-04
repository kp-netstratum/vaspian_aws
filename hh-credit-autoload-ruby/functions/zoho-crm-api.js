const axios = require('axios');
require('dotenv').config();

class ZohoCrmApi {
    constructor() {
        this.baseUrl = 'https://www.zohoapis.com/crm/v5/';
        this.conn = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.token = null;
    }

    async refreshAccessTokens() {
        const refreshUrl = `https://accounts.zoho.com/oauth/v2/token?refresh_token=${process.env.CRM_REFRESH_TOKEN}&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=refresh_token`;

        try {
            const response = await axios.post(refreshUrl);
            const { access_token: token } = response.data;
            this.token = token;
            this.conn.defaults.headers.common['Authorization'] = `Zoho-oauthtoken ${this.token}`;
            console.info('Zoho access token received');
        } catch (error) {
            console.error('Zoho access token not received');
            if (error.response) {
                console.debug(error.response.status);
                console.debug(error.response.data);
            } else {
                console.error(error.message);
            }
        }
        return this.token;
    }

    async apiCall(url, type, payload = null) {
        try {
            const response = await this.conn({
                method: type,
                url,
                data: payload,
            });
            console.info(`Zoho ${type} to ${url} successful`);
            console.info(response.data);
            return response.data;
        } catch (error) {
            console.error(`Zoho ${type} to ${url} failed`);
            if (error.response) {
                console.debug(error.response.status);
                console.debug(error.response.data);
            } else {
                console.error(error.message);
            }
            return 'fail';
        }
    }

    async search(zModule, params) {
        const url = `${zModule}/search?criteria=${params}`;
        return this.apiCall(url, 'get');
    }

    async coql(selectQuery) {
        const payload = { select_query: selectQuery };
        return this.apiCall('coql', 'post', payload);
    }

    async zohoCrmPost(url, payload, type = '') {
        const payloadLen = payload.length;
        const numOfRequests = Math.ceil(payloadLen / 100);
        let startIndex = 0;
        let endIndex = payloadLen > 100 ? 99 : payloadLen - 1;
        const respArray = [];
        const postUrl = type === 'upsert' ? `${url}/${type}` : url;

        for (let iteration = 1; iteration <= numOfRequests; iteration++) {
            const data = { data: payload.slice(startIndex, endIndex + 1) };
            const apiResp = await this.apiCall(postUrl, 'post', data);
            respArray.push(apiResp.data);

            startIndex += 100;
            endIndex += 100;
            if (iteration + 1 === numOfRequests) {
                endIndex = payloadLen - 1;
            }
        }
        return respArray;
    }
}

module.exports = ZohoCrmApi;