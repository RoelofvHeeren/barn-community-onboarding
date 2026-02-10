const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const axios = require('axios');

const GHL_API_KEY = process.env.VITE_GHL_API_KEY;
const LOCATION_ID = 'VYZcxHGdxD0Dj1cj1ZU4';
const GHL_BASE_URL = 'https://services.leadconnectorhq.com';

const HEADERS = {
    'Authorization': `Bearer ${GHL_API_KEY}`,
    'Version': '2021-07-28',
    'Content-Type': 'application/json'
};

async function main() {
    console.log("🔍 Searching for 'Barn' fields...");
    try {
        const res = await axios.get(`${GHL_BASE_URL}/locations/${LOCATION_ID}/customFields`, {
            headers: HEADERS,
            params: {
                model: 'CONTACT',
                limit: 100, // Try limit again? Maybe 422 was due to something else? 
                // earlier error: "property limit should not exist". So NO limit.
            }
        });

        const allFields = res.data.customFields || [];
        console.log(`Total Fields In Response: ${allFields.length}`);

        const barnFields = allFields.filter(f => f.name.toLowerCase().includes('barn'));
        console.log("Barn fields found:", barnFields.map(f => `${f.name} (${f.id})`));

        if (res.data.meta) {
            console.log("Pagination Meta:", res.data.meta);
        }

    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
    }
}

main();
