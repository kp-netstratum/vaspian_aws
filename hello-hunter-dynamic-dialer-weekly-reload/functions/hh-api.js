const axios = require('axios');

class HelloHunterApi {
    constructor() {
        this.conn = axios.create({
            baseURL: 'https://SQL-04.dialer.rocks/a/v1/resellers/',
            headers: { 'Content-Type': 'application/json' },
        });
        this.token = null;
        this.response = null;
    }

    async connect() {
        const creds = {
            name: process.env.HH_USERNAME,
            pass: process.env.HH_PASSWORD,
        };

        try {
            const response = await this.conn.post('login.json', creds);
            this.response = response.data;

            if (response.status === 200) {
                console.info('Hello Hunter login successful');
                this.token = this.response.token;
            } else {
                console.error('Hello Hunter Token not received');
                console.debug(response.data);
                console.debug(response.status);
            }
        } catch (error) {
            console.error('Error connecting to Hello Hunter API:', error.message);
            if (error.response) {
                console.debug(error.response.data);
                console.debug(error.response.status);
            }
        }
    }

    async getCustomers() {
        if (!this.response || !this.response.user_groups) {
            console.error('No customers found. Make sure to connect first.');
            return [];
        }

        const customers = this.response.user_groups;
        console.info(`Retrieving HH customers: ${customers.length} customers`);
        return customers;
    }

    async giveCredit(z_hh_id, reload_amount) {
        const params = {
            user_group_id: z_hh_id,
            to_add: reload_amount,
        };

        try {
            const response = await this.conn.put(`add_balance.json?token=${this.token}`, params);
            if (response.status === 200) {
                console.info(`Reload API call success. Amount added: ${response.data.amount}`);
                return response.status;
            } else {
                console.error(`Hello Hunter reload of $${reload_amount} failed for ${z_hh_id}`);
                console.debug(response.data);
                console.debug(response.status);
                return null;
            }
        } catch (error) {
            console.error(`Error reloading balance for ${z_hh_id}:`, error.message);
            if (error.response) {
                console.debug(error.response.data);
                console.debug(error.response.status);
            }
            return null;
        }
    }
}

module.exports = HelloHunterApi;