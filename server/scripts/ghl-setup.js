const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const axios = require('axios');

const GHL_API_KEY = process.env.VITE_GHL_API_KEY;
const LOCATION_ID = 'VYZcxHGdxD0Dj1cj1ZU4';

if (!GHL_API_KEY) {
    console.error("❌ No GHL API Key found in .env");
    process.exit(1);
}

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';

const HEADERS = {
    'Authorization': `Bearer ${GHL_API_KEY}`,
    'Version': '2021-07-28',
    'Content-Type': 'application/json'
};

// Map our Quiz Question IDs to desired Field Names
const FIELDS_TO_CREATE = {
    'goal': 'Barn Community V2 - Fitness Goal',
    'gender': 'Barn Community V2 - Gender',
    'age': 'Barn Community V2 - Age Range',
    'experience': 'Barn Community V2 - Experience Level',
    'frequency': 'Barn Community V2 - Training Frequency',
    'duration': 'Barn Community V2 - Session Duration',
    'cardio': 'Barn Community V2 - Cardio Preference',
    'equipment': 'Barn Community V2 - Equipment Access',
    'limitations': 'Barn Community V2 - Injuries',
    'program_slug': 'Barn Community V2 - Recommended Program'
};

async function getExistingFields(locationId) {
    try {
        const res = await axios.get(`${GHL_BASE_URL}/locations/${locationId}/customFields`, { headers: HEADERS });
        return res.data.customFields || [];
    } catch (error) {
        console.error("❌ Failed to fetch fields:", error.response?.data || error.message);
        process.exit(1);
    }
}

async function createField(locationId, key, name) {
    try {
        const payload = {
            name: name,
            dataType: "TEXT", // Changed from TEXT_BOX
            placeholder: `Enter ${name}`,
            // model: "CONTACT" // Removed to avoid enum errors if default
        };
        const res = await axios.post(`${GHL_BASE_URL}/locations/${locationId}/customFields`, payload, { headers: HEADERS });
        console.log(`✅ Created Field: ${name}`);
        return res.data.customField || res.data;
    } catch (error) {
        if (error.response?.status === 422) {
            console.log(`⚠️  Field "${name}" might already exist or invalid payload (422). Details:`, JSON.stringify(error.response.data));
        } else {
            console.error(`❌ Failed to create ${name}:`, error.response?.data || error.message);
        }
        return null;
    }
}

async function getPipelineDetails(locationId) {
    console.log("🔍 Fetching Pipelines...");
    try {
        // Correct V2 Endpoint: /opportunities/pipelines?locationId=...
        const res = await axios.get(`${GHL_BASE_URL}/opportunities/pipelines/?locationId=${locationId}`, { headers: HEADERS });
        const pipelines = res.data.pipelines || [];

        const barnPipeline = pipelines.find(p => p.name === "Barn Community");

        if (!barnPipeline) {
            console.error("❌ 'Barn Community' pipeline not found. Available pipelines:", pipelines.map(p => p.name));
            return null;
        }

        console.log(`✅ Found Pipeline: Barn Community (${barnPipeline.id})`);

        const stages = {};
        barnPipeline.stages.forEach(stage => {
            stages[stage.name] = stage.id;
        });

        return {
            id: barnPipeline.id,
            stages: stages
        };

    } catch (error) {
        console.error("❌ Failed to fetch pipelines:", error.response?.data || error.message);
        return null;
    }
}

async function main() {
    console.log(`📍 Using Location ID: ${LOCATION_ID}`);

    // 1. Custom Fields
    console.log("🔍 Syncing Custom Fields...");
    // Fetch all to start
    const existingFields = await getExistingFields(LOCATION_ID);
    console.log(`ℹ️  Found ${existingFields.length} existing custom fields.`);
    console.log("Existing Field Names:", existingFields.map(f => f.name));

    const fieldMapping = {};

    for (const [key, name] of Object.entries(FIELDS_TO_CREATE)) {
        // Try strict match
        let match = existingFields.find(f => f.name === name);

        if (match) {
            console.log(`ℹ️  Found existing: ${name} (${match.id})`);
            fieldMapping[key] = match.id;
        } else {
            console.log(`✨ Creating new field: ${name}...`);
            const newField = await createField(LOCATION_ID, key, name);
            if (newField && newField.id) {
                fieldMapping[key] = newField.id;
            } else {
                // If creation failed (e.g. 422), maybe we missed it in the list?
                // Let's rely on the user to check, or we can try to re-fetch if needed.
                console.warn(`⚠️  Could not map field: ${name}`);
            }
        }
    }

    // 2. Pipeline Details
    const pipelineData = await getPipelineDetails(LOCATION_ID);

    // 3. Output Configuration
    const config = {
        locationId: LOCATION_ID,
        fields: fieldMapping,
        pipeline: pipelineData || {}
    };

    const configPath = path.join(__dirname, '../config/ghl-config.json');
    // Ensure config dir exists
    if (!fs.existsSync(path.dirname(configPath))) {
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log(`\n✅ Configuration saved to: ${configPath}`);
    console.log(JSON.stringify(config, null, 2));
}

main();
