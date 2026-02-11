const axios = require('axios');

const TRAINERIZE_API_URL = 'https://api.trainerize.com/v03';

// Helper to encode credentials for Basic Auth
function getAuthHeader() {
    const groupID = process.env.VITE_TRAINERIZE_GROUP_ID || process.env.TRAINERIZE_GROUP_ID; // Support both naming conventions
    const apiToken = process.env.VITE_TRAINERIZE_API_TOKEN || process.env.TRAINERIZE_API_TOKEN;

    if (!groupID || !apiToken) {
        console.error("Missing Trainerize credentials in .env");
        throw new Error("Missing Trainerize credentials");
    }

    const credentials = Buffer.from(`${groupID}:${apiToken}`).toString('base64');
    return `Basic ${credentials}`;
}

const api = axios.create({
    baseURL: TRAINERIZE_API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add interceptor to inject auth header dynamically so it picks up env vars at runtime
api.interceptors.request.use(config => {
    config.headers['Authorization'] = getAuthHeader();
    return config;
});

async function createClient(user) {
    console.log(`[Trainerize] Creating client for: ${user.email}`);

    try {
        const payload = {
            email: user.email,
            firstName: user.first_name || user.firstName || '',
            lastName: user.last_name || user.lastName || '',
            role: 'client',
            status: 'active'
        };

        if (user.phone) {
            payload.mobilePhone = user.phone;
        }

        console.log(`[Trainerize] POST /user/add payload:`, JSON.stringify(payload));
        const res = await api.post('/user/add', payload);

        // Validate we got a proper JSON response (not an HTML error page)
        const contentType = res.headers?.['content-type'] || '';
        if (contentType.includes('text/html')) {
            console.error('[Trainerize] ❌ Got HTML response instead of JSON - API endpoint may be wrong');
            console.error('[Trainerize] Response:', typeof res.data === 'string' ? res.data.substring(0, 200) : res.data);
            throw new Error('Trainerize API returned HTML instead of JSON');
        }

        console.log('[Trainerize] ✅ Client created:', JSON.stringify(res.data));
        return res.data;
    } catch (error) {
        console.error('[Trainerize] ❌ Error creating client:', error.response?.status, error.response?.data || error.message);
        // If user already exists (409), try to find them
        if (error.response?.status === 409) {
            console.log('[Trainerize] User already exists, attempting to find...');
            try {
                const findRes = await api.post('/user/find', { email: user.email });
                if (findRes.data?.userID) {
                    console.log(`[Trainerize] ✅ Found existing user: ${findRes.data.userID}`);
                    return findRes.data;
                }
            } catch (findErr) {
                console.error('[Trainerize] ❌ Failed to find existing user:', findErr.message);
            }
        }
        throw error;
    }
}

async function activateProgram(clientId, programId) {
    console.log(`[Trainerize] Activating program ${programId} for client ${clientId}`);

    if (!programId || programId === '00000') {
        console.warn(`[Trainerize] Invalid Program ID provided: ${programId}`);
        return false;
    }

    try {
        const payload = {
            userID: parseInt(clientId, 10),
            programID: parseInt(programId, 10),
            startDate: new Date().toISOString().split('T')[0], // today YYYY-MM-DD
            forceMerge: true
        };

        console.log(`[Trainerize] POST /program/copyToUser payload:`, JSON.stringify(payload));
        const res = await api.post('/program/copyToUser', payload);
        console.log(`[Trainerize] ✅ Program assigned:`, JSON.stringify(res.data));
        return true;
    } catch (error) {
        console.error(`[Trainerize] ❌ Error assigning program:`, error.response?.status, error.response?.data || error.message);
        throw error;
    }
}

async function deactivateClient(userId) {
    console.log(`[Trainerize] Deactivating client ${userId}...`);

    if (!userId) {
        console.warn('[Trainerize] Cannot deactivate: No User ID provided');
        return false;
    }

    try {
        const payload = {
            userID: parseInt(userId, 10),
            status: 'deactivated'
        };

        // Using /user/setStatus to change the user's status
        const res = await api.post('/user/setStatus', payload);
        console.log(`[Trainerize] ✅ Client ${userId} deactivated:`, res.data);
        return true;
    } catch (error) {
        console.error(`[Trainerize] ❌ Error deactivating client:`, error.response?.status, error.response?.data || error.message);
        throw error;
    }
}

module.exports = {
    createClient,
    activateProgram,
    deactivateClient
};
