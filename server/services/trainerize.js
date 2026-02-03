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
    console.log(`Creating Trainerize client for: ${user.email}`);

    try {
        const payload = {
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: 'client',
            status: 'active'
        };

        if (user.phone) {
            payload.mobile_phone = user.phone;
        }

        const res = await api.post('/users', payload);
        console.log('Client created successfully:', res.data);
        return res.data;
    } catch (error) {
        console.error('Error creating client:', error.response?.data || error.message);
        // If user already exists, we might want to return the existing user or handle gracefully
        if (error.response?.status === 409) {
            console.log('User likely already exists, checking for existing user...');
            // Logic to find user could go here, for now re-throw or return null
        }
        throw error;
    }
}

async function activateProgram(clientId, programId) {
    console.log(`Activating program ID ${programId} for client ${clientId}`);

    if (!programId || programId === '00000') {
        console.warn(`Invalid Program ID provided: ${programId}`);
        return false;
    }

    try {
        const payload = {
            userID: parseInt(clientId, 10),
            programID: parseInt(programId, 10),
            startDate: new Date().toISOString().split('T')[0], // today YYYY-MM-DD
            forceMerge: true
        };

        // Using copyToUser as identified in documentation
        const res = await api.post('/program/copyToUser', payload);
        console.log(`Program assigned successfully:`, res.data);
        return true;
    } catch (error) {
        console.error(`Error assigning program:`, error.response?.data || error.message);
        throw error;
    }
}

async function deactivateClient(userId) {
    console.log(`Deactivating client ${userId}...`);

    if (!userId) {
        console.warn("Cannot deactivate: No User ID provided");
        return false;
    }

    try {
        const payload = {
            userID: parseInt(userId, 10),
            status: 'deactivated'
        };

        // Using the same /users endpoint with PUT/POST to update status
        // Documentation implies updating user properties directly
        const res = await api.put('/users', payload);
        console.log(`Client ${userId} deactivated successfully:`, res.data);
        return true;
    } catch (error) {
        console.error(`Error deactivating client:`, error.response?.data || error.message);
        // Fallback: If PUT not supported, try known pattern or just log error
        // Some APIs require specific deactivation endpoint, but standard is invalidating status
        throw error;
    }
}

module.exports = {
    createClient,
    activateProgram,
    deactivateClient
};
