const axios = require('axios');
require('dotenv').config();

class ZohoBooksApi {
    constructor() {
        this.baseUri = 'https://books.zoho.com/api/v3'
        this.headers = {
            'content-type': 'application/json'
        };
        this.refresh_access_tokens();
    }

    async refresh_access_tokens() {
        const refreshUrl = `https://accounts.zoho.com/oauth/v2/token?refresh_token=${process.env.BOOKS_REFRESH_TOKEN}&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=refresh_token`;
        try {
            const response = await axios.post(refreshUrl);
            const token = response.data;
            this.headers['Authorization'] = `Zoho-oauthtoken ${token.access_token}`;
        } catch (error) {
            console.error('Error refreshing access tokens:', error);
        }
    }

    async books_contact_from_crm_id(id) {
        const payload = { "zcrm_account_id": id };
        const booksContact = await this.api_call('contacts', 'get', payload);
        return booksContact.contacts ? booksContact.contacts[0] : null;
    }

    async api_call(endpoint, method, payload = null) {
        const urlWithOrg = `${this.baseUrl}${url}?organization_id=${process.env.BOOKS_ORG_ID}`;
        let response;

        try {
            switch (type) {
                case 'get':
                    response = await axios.get(urlWithOrg, { headers: this.headers, params: payload });
                    break;
                case 'post':
                    response = await axios.post(urlWithOrg, payload, { headers: this.headers });
                    break;
                case 'put':
                    response = await axios.put(urlWithOrg, payload, { headers: this.headers });
                    break;
                default:
                    throw new Error(`Unsupported request type: ${type}`);
            }

            if ([200, 201].includes(response.status)) {
                const data = response.data;
                if (data.code === 0) {
                    console.info(`Books ${type} to ${url} successful`);
                } else {
                    console.error(`Books ${type} to ${url} message ${data.message}`);
                }
                return data;
            } else if (response.status === 204) {
                console.info(`Zoho ${type} to ${url} successful. No data returned.`);
                console.debug(response.data);
                return 'no data';
            }
        } catch (error) {
            console.error(`Books ${type} to ${url} failed`, error.message);
            if (error.response) {
                console.debug(error.response.status);
                console.debug(error.response.data);
            }
        }
    }
}

module.exports = ZohoBooksApi;