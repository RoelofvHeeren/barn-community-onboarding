const axios = require('axios');
const path = require('path');
const config = require('../config/ghl-config.json');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const GHL_API_KEY = process.env.VITE_GHL_API_KEY;
const BASE_URL = 'https://services.leadconnectorhq.com';

const HEADERS = {
    'Authorization': `Bearer ${GHL_API_KEY}`,
    'Version': '2021-07-28',
    'Content-Type': 'application/json'
};

const PROGRAM_TAG_MAP = {
    'power-building': 'Program: Power Building',
    'hybrid-athlete': 'Program: Hybrid Athlete',
    'kettlebell-program': 'Program: Kettlebell',
    'running-program': 'Program: Running',
    'bodyweight': 'Program: Bodyweight',
    'functional-bodybuilding': 'Program: Functional Bodybuilding',
    'athlete-program': 'Program: Athlete',
    'sculpt-tone': 'Program: Sculpt & Tone',
    'female-functional': 'Program: Female Functional'
};

/**
 * Syncs a user to GHL (Create/Update) with Quiz Answers mapped to Custom Fields.
 * @param {Object} userData - { email, firstName, lastName, phone, answers, programSlug }
 * @returns {Promise<string>} contactId
 */
async function syncContact(userData) {
    if (!userData.email) throw new Error("Email required for GHL sync");

    // 1. Map Custom Fields
    const customFields = [];
    if (userData.answers) {
        for (const [key, value] of Object.entries(userData.answers)) {
            const fieldId = config.fields[key];
            if (fieldId) {
                customFields.push({ id: fieldId, value: value });
            }
        }
    }

    // Map Program Slug if provided
    if (userData.programSlug && config.fields.program_slug) {
        customFields.push({ id: config.fields.program_slug, value: userData.programSlug });
    }

    const initialTags = ['Trial Community'];
    if (userData.programSlug && PROGRAM_TAG_MAP[userData.programSlug]) {
        initialTags.push(PROGRAM_TAG_MAP[userData.programSlug]);
    }

    const payload = {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        locationId: config.locationId,
        customFields: customFields,
        tags: initialTags
    };

    try {
        const res = await axios.post(`${BASE_URL}/contacts/upsert`, payload, { headers: HEADERS });
        console.log(`✅ GHL Contact Synced: ${userData.email}`);
        return res.data.contact?.id || res.data.contact?.contactId;
    } catch (error) {
        console.error("❌ GHL Sync Contact Error:", error.response?.data || error.message);
        throw error;
    }
}

/**
 * Adds and Removes tags for a contact.
 * @param {string} contactId 
 * @param {string[]} tagsToAdd 
 * @param {string[]} tagsToRemove 
 */
async function manageTags(contactId, tagsToAdd = [], tagsToRemove = []) {
    try {
        // GHL V2 doesn't have a bulk 'manage tags' endpoint easily, usually it's per tag or part of update.
        // But POST /contacts/{id}/tags is common.
        // Let's iterate for safety or check if we can pass array.
        // API Docs say: POST /contacts/{id}/tags { tags: ["tag1", "tag2"] }

        if (tagsToAdd.length > 0) {
            await axios.post(`${BASE_URL}/contacts/${contactId}/tags`, { tags: tagsToAdd }, { headers: HEADERS });
            console.log(`🏷️  Added tags [${tagsToAdd}] to ${contactId}`);
        }

        if (tagsToRemove.length > 0) {
            // DELETE /contacts/{id}/tags is delete ALL? Or delete specific?
            // DELETE /contacts/{id}/tags { tags: [...] } body? Axios delete with data.
            await axios.delete(`${BASE_URL}/contacts/${contactId}/tags`, {
                headers: HEADERS,
                data: { tags: tagsToRemove }
            });
            console.log(`🗑️  Removed tags [${tagsToRemove}] from ${contactId}`);
        }

    } catch (error) {
        console.error("❌ GHL Manage Tags Error:", error.response?.data || error.message);
    }
}

/**
 * createOrUpdateOpportunity
 * Since we don't store Opp ID, we try to Find Open Opportunity in Pipeline first.
 * If found, update. If not, create.
 */
async function updatePipelineStage(contactId, stageName, status = 'open', opportunityName = null) {
    const stageId = config.pipeline.stages[stageName];
    if (!stageId) {
        console.error(`❌ Invalid Stage Name: ${stageName}`);
        return;
    }

    // 1. Find existing opportunity for contact in this pipeline
    let opportunityId = null;
    try {
        const search = await axios.get(`${BASE_URL}/opportunities/search`, {
            headers: HEADERS,
            params: {
                location_id: config.locationId,
                contact_id: contactId,
                pipeline_id: config.pipeline.id,
                status: 'open' // Look for open ones first
            }
        });

        if (search.data.opportunities && search.data.opportunities.length > 0) {
            opportunityId = search.data.opportunities[0].id;
        }
    } catch (e) {
        console.warn("⚠️  Could not search opportunities, will attempt create.", e.message);
    }

    const payload = {
        pipelineId: config.pipeline.id,
        pipelineStageId: stageId,
        status: status,
        name: opportunityName || "Barn Community Membership",
        contactId: contactId
        // locationId removed as it's not accepted by this endpoint version/auth method
    };

    try {
        if (opportunityId) {
            await axios.put(`${BASE_URL}/opportunities/${opportunityId}`, payload, { headers: HEADERS });
            console.log(`🔄 Updated Opportunity ${opportunityId} to stage: ${stageName}`);
        } else {
            await axios.post(`${BASE_URL}/opportunities/`, payload, { headers: HEADERS });
            console.log(`✨ Created Opportunity in stage: ${stageName}`);
        }
    } catch (error) {
        console.error("❌ GHL Opportunity Error:", error.response?.data || error.message);
    }
}

module.exports = {
    syncContact,
    manageTags,
    updatePipelineStage
};
