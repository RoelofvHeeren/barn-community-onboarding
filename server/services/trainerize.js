const axios = require('axios');

const TRAINERIZE_API_URL = 'https://api.trainerize.com/v1'; // Check actual URL
const API_KEY = process.env.TRAINERIZE_API_KEY;

// NOTE: These are placeholder implementations. 
// We need the ACTUAL Trainerize API docs to know the endpoints.

const api = axios.create({
    baseURL: TRAINERIZE_API_URL,
    headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
    }
});

async function createClient(user) {
    console.log(`[Mock] Creating Trainerize client: ${user.email}`);
    // Mock Response
    return { id: 'mock_client_123', email: user.email };

    /* 
    const res = await api.post('/clients', {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
    });
    return res.data; 
    */
}

async function activateProgram(clientId, programSlug) {
    console.log(`[Mock] Activating program ${programSlug} for client ${clientId}`);
    // Map internal slug to Trainerize Program ID
    const programId = getTrainerizeProgramId(programSlug);

    /*
    await api.post(`/clients/${clientId}/programs`, {
        program_id: programId,
        start_date: new Date().toISOString()
    });
    */
    return true;
}

async function deactivateProgram(clientId) {
    console.log(`[Mock] Deactivating programs for client ${clientId}`);
    return true;
}

function getTrainerizeProgramId(slug) {
    const MAPPING = {
        'power_building': '12345',
        'hybrid_athlete': '67890',
        'kettlebell_program': '11111',
        // ... add others
    };
    return MAPPING[slug] || '00000';
}

module.exports = {
    createClient,
    activateProgram,
    deactivateProgram
};
