const axios = require('axios');

const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN; // System User Token
const BASE_URL = 'https://graph.facebook.com/v19.0';

const facebookService = {
    /**
     * Fetch Lead Details from Facebook Graph API
     * @param {string} leadgenId - ID of the lead from the webhook
     */
    async getLeadDetails(leadgenId) {
        try {
            const response = await axios.get(`${BASE_URL}/${leadgenId}`, {
                params: {
                    access_token: FB_ACCESS_TOKEN,
                    fields: 'email,full_name,phone_number' // Customize based on your form fields
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching Facebook lead:', error.response?.data || error.message);
            throw error;
        }
    }
};

module.exports = facebookService;
