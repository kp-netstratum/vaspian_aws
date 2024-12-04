const axios = require('axios');
require('dotenv').config();

class HelloHunterApi {
    constructor() {
        this.baseUrl = 'https://SQL-04.dialer.rocks/a/v1/resellers/';
        this.conn = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.token = null;
        this.customers = null;
    }

    async connect() {
        const creds = {
            name: process.env.HH_USERNAME,
            pass: process.env.HH_PASSWORD,
        };

        try {
            const response = await this.conn.post('login.json', creds);
            const { token, user_groups: customers } = response.data;
            this.token = token;
            this.customers = customers;
            console.info('Hello Hunter login successful');
        } catch (error) {
            console.error('Hello Hunter Token not received');
            if (error.response) {
                console.debug(error.response.status);
                console.debug(error.response.data);
            } else {
                console.error(error.message);
            }
        }
    }

    async giveCredit(z_hh_id, reloadAmount) {
        const params = {
            user_group_id: z_hh_id,
            to_add: reloadAmount,
        };

        try {
            const response = await this.conn.put(
                `add_balance.json?token=${this.token}`,
                params
            );
            console.info(`Reload API call success. Amount added: ${response.data.amount}`);
            return response.status;
        } catch (error) {
            console.error(`Hello Hunter reload of $${reloadAmount} failed for ${z_hh_id}`);
            if (error.response) {
                console.debug(error.response.status);
                console.debug(error.response.data);
            } else {
                console.error(error.message);
            }
            return null;
        }
    }
}

module.exports = HelloHunterApi;
