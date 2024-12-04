const axios = require('axios');
const logger = require('./logger'); // Import the logger module

class CrmApi {
    constructor() {
        this.conn = axios.create({
            baseURL: 'https://www.zohoapis.com/crm/v3/',
            headers: { 'Content-Type': 'application/json' }
        });
        this.refreshToken();
    }

    async refreshToken() {
        try {
            const refUrl = `https://accounts.zoho.com/oauth/v2/token?refresh_token=${process.env.REFRESH_TOKEN}&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=refresh_token`;
            const response = await this.conn.post(refUrl);

            const token = response.data;

            if (token && response.status === 200) {
                logger.info('Zoho refresh Token received');
                this.conn.defaults.headers['Authorization'] = `Zoho-oauthtoken ${token.access_token}`;
            } else {
                logger.error('Zoho refresh Token not received');
                logger.debug(response.data);
                logger.debug(response.status);
            }

            this.retrievalTime = new Date().toLocaleTimeString();
        } catch (error) {
            logger.error('Error during Zoho token refresh');
            logger.debug(error);
        }
    }

    async search(zModule, params) {
        try {
            const url = `${zModule}/search?criteria=${params}`;
            const response = await this.conn.get(url);

            if (response.status === 200) {
                logger.info('Zoho search record returned data');
                return response.data.data || [];
            } else {
                logger.info('Zoho search record returned no data');
                logger.debug(response.data);
                logger.debug(response.status);
                return [];
            }
        } catch (error) {
            logger.error('Error during Zoho search');
            logger.debug(error);
            return [];
        }
    }

    async postPut(zModule, payload, postType = '') {
        const apiUrl = `${zModule}${postType}`;
        const payloadLength = payload.length;
        const numOfReq = Math.ceil(payloadLength / 100);
        let startInd = 0;
        let endInd = payloadLength > 100 ? 99 : payloadLength - 1;
        let respArray = [];

        for (let iteration = 1; iteration <= numOfReq; iteration++) {
            const dataHash = { data: payload.slice(startInd, endInd + 1) };
            const postResp = await this.post(apiUrl, dataHash);
            respArray.push(postResp);

            startInd += 100;
            endInd += 100;

            if (iteration === numOfReq) {
                endInd = payloadLength - 1;
            }
        }
        return respArray;
    }

    async post(url, payload) {
        try {
            const response = await this.conn.post(url, payload);

            if ([200, 201, 202, 204].includes(response.status)) {
                logger.info('Zoho post successful');
                return response.data.data;
            } else {
                logger.error('Zoho post failed');
                logger.debug(response.data);
                logger.debug(response.status);
                return 'fail';
            }
        } catch (error) {
            logger.error('Error during Zoho post');
            logger.debug(error);
            return 'fail';
        }
    }
}

module.exports = CrmApi;
