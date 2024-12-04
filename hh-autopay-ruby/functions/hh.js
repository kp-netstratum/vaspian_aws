const axios = require('axios');
const logger = require('./logger');

class HelloHunterApi {
    constructor() {
        this.conn = axios.create({
            baseURL: 'https://SQL-04.dialer.rocks/a/v1/resellers/',
            headers: { 'Content-Type': 'application/json' }
        });
        this.token = null;
        this.response = null;
        this.connect();
    }

    async connect() {
        try {
            const creds = { name: process.env.HH_USERNAME, pass: process.env.HH_PASSWORD };
            const response = await this.conn.post('login.json', creds);
            this.response = response.data;
            if (response.status === 200) {
                logger.info('Hello Hunter login successful');
                this.token = this.response.token;
            } else {
                logger.error('Hello Hunter Token not received');
                logger.debug(this.response);
            }
        } catch (error) {
            logger.error('Error during Hello Hunter login');
            logger.debug(error);
        }
    }

    getCust() {
        if (this.response && this.response.user_groups) {
            const customers = this.response.user_groups;
            logger.info(`Retrieving HH customers: ${customers.length} customers`);
            return customers;
        }
        return [];
    }

    async giveCredit(z_hh_id, reload_amount) {
        try {
            const params = { user_group_id: z_hh_id, to_add: reload_amount };
            const response = await this.conn.put(`add_balance.json?token=${this.token}`, params);
            if (response.status === 200) {
                logger.info(`Reload api call success. Amount added ${response.data.amount}`);
                return response.status;
            } else {
                logger.error(`Hello Hunter reload of $${reload_amount} failed for ${z_hh_id}`);
                logger.debug(response.data);
                return null;
            }
        } catch (error) {
            logger.error(`Error during Hello Hunter reload for ${z_hh_id}`);
            logger.debug(error);
            return null;
        }
    }
}

module.exports = HelloHunterApi;
