const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const crypto = require('crypto');

const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

/**
 * Hash data for Meta CAPI (SHA-256)
 * @param {string} data needs to be normalized (lowercase, trim) before hashing
 */
function hash(data) {
    if (!data) return undefined;
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Send event to Meta Conversion API
 * @param {string} eventName - Standard or Custom Event Name
 * @param {object} userData - { email, phone, firstName, lastName, clientIp, userAgent, fbc, fbp }
 * @param {object} customData - { value, currency, content_name, content_ids, status }
 * @param {string} eventId - Unique ID for deduplication
 */
async function sendEvent(eventName, userData, customData = {}, eventId = null) {
    if (!PIXEL_ID || !ACCESS_TOKEN) {
        console.warn("⚠️ Meta Pixel ID or Access Token missing. Event not sent.");
        return;
    }

    const payload = {
        data: [
            {
                event_name: eventName,
                event_time: Math.floor(Date.now() / 1000),
                event_id: eventId,
                action_source: "website",
                user_data: {
                    em: hash(userData.email?.toLowerCase().trim()),
                    ph: hash(userData.phone?.replace(/[^0-9]/g, '')), // Strips + and spaces
                    fn: hash(userData.firstName?.toLowerCase().trim()),
                    ln: hash(userData.lastName?.toLowerCase().trim()),
                    client_ip_address: userData.clientIp,
                    client_user_agent: userData.userAgent,
                    fbc: userData.fbc,
                    fbp: userData.fbp,
                    external_id: hash(userData.email?.toLowerCase().trim()) // Consistent ID
                },
                custom_data: customData
            }
        ]
        // test_event_code: 'TEST1234' // TODO: Remove in prod or make configurable
    };

    try {
        const response = await axios.post(
            `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
            payload
        );
        console.log(`✅ Meta CAPI Event Sent: ${eventName}`, response.data);
    } catch (error) {
        console.error(`❌ Meta CAPI Error (${eventName}):`, error.response?.data || error.message);
    }
}

module.exports = { sendEvent };
