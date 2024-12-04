const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

class Zoho {
    // Refresh access tokens
    async refreshAccessTokens(refreshToken) {
        const refreshUrl = `https://accounts.zoho.com/oauth/v2/token?refresh_token=${refreshToken}&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=refresh_token`;

        try {
            const response = await axios.post(refreshUrl);
            const token = response.data.access_token;
            console.log('Zoho access token received');
            return token;
        } catch (error) {
            console.error('Zoho access token not received');
            console.error(`Status: ${error.response?.status}`);
            console.error(`Body: ${error.response?.data}`);
            throw error; // Re-throw the error for proper error handling later
        }
    }

    // General API call function (GET, POST, PUT, DELETE)
    async apiCall(url, type, payload = null) {
        try {
            let response;
            switch (type.toLowerCase()) {
                case 'get':
                    response = await axios.get(url, { params: payload });
                    break;
                case 'post':
                    response = await axios.post(url, payload);
                    break;
                case 'put':
                    response = await axios.put(url, payload);
                    break;
                case 'delete':
                    response = await axios.delete(url, { data: payload });
                    break;
                default:
                    throw new Error(`Unsupported request type: ${type}`);
            }

            console.log(`Zoho ${type.toUpperCase()} to ${url} successful`);
            return response.data;
        } catch (error) {
            console.error(`Zoho ${type.toUpperCase()} to ${url} failed`);
            console.error(`Status: ${error.response?.status}`);
            console.error(`Body: ${error.response?.data}`);
            return 'fail'; // Handle failure response appropriately
        }
    }
}

module.exports = Zoho;
