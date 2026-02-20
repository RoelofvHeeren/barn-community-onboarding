const axios = require('axios');

const CIRCLE_API_TOKEN = process.env.CIRCLE_API_TOKEN;
const BASE_URL = 'https://app.circle.so/api/v1';

// Space Group IDs
const SPACE_GROUPS = {
    SILVER: 820986, // Core Training
    BRONZE: 820983  // Foundation
};

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Authorization': `Token ${CIRCLE_API_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

const circleService = {
    /**
     * Create a new member in Circle
     * @param {Object} memberData - { email, name, password }
     */
    async createMember(memberData) {
        try {
            const payload = {
                email: memberData.email,
                name: memberData.name,
                password: memberData.password,
                community_id: 378435,
                space_group_ids: [SPACE_GROUPS.SILVER, SPACE_GROUPS.BRONZE] // Give both initially
            };

            const response = await axiosInstance.post('/community_members', payload);
            return response.data;
        } catch (error) {
            // Rethrow or handle
            console.error('Error creating Circle member:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Add a member to a specific space group
     */
    async addMemberToSpaceGroup(email, spaceGroupId) {
        try {
            await axiosInstance.post('/space_group_members', {
                email,
                space_group_id: spaceGroupId,
                community_id: 378435
            });
            console.log(`Added ${email} to Space Group ${spaceGroupId}`);
        } catch (error) {
            // Ignore if already a member, otherwise log
            if (error.response?.status !== 422) {
                console.error(`Error adding ${email} to group ${spaceGroupId}:`, error.response?.data || error.message);
            }
        }
    },

    /**
     * Remove a member from a specific space group
     */
    async removeMemberFromSpaceGroup(email, spaceGroupId) {
        try {
            // Circle API uses DELETE with params on some endpoints, double check documentation
            // Based on earlier research: DELETE /space_group_members?email=...
            await axiosInstance.delete('/space_group_members', {
                params: {
                    email,
                    space_group_id: spaceGroupId,
                    community_id: 378435
                }
            });
            console.log(`Removed ${email} from Space Group ${spaceGroupId}`);
        } catch (error) {
            console.error(`Error removing ${email} from group ${spaceGroupId}:`, error.response?.data || error.message);
        }
    },

    /**
     * Helper to search for a member
     */
    async searchMember(email) {
        try {
            const response = await axiosInstance.get('/community_members/search', {
                params: { query: email, community_id: 378435 }
            });
            // The search returns an ARRAY of members
            const members = response.data;
            return members.find(m => m.email.toLowerCase() === email.toLowerCase());
        } catch (error) {
            console.error(`Error searching member ${email}:`, error.response?.data || error.message);
            return null;
        }
    },

    /**
     * List recent members
     */
    async listMembers(limit = 100) {
        try {
            const response = await axiosInstance.get('/community_members', {
                params: {
                    community_id: 378435,
                    per_page: limit,
                    sort: 'latest'
                }
            });
            // The API might return an array directly OR { results: [] } OR { members: [] }
            // Given searchMember returns array, this likely does too.
            // But let's be safe.
            if (Array.isArray(response.data)) return response.data;
            if (Array.isArray(response.data.results)) return response.data.results;
            if (Array.isArray(response.data.members)) return response.data.members;

            console.warn('[Circle Service] Unexpected list response structure:', Object.keys(response.data));
            return [];
        } catch (error) {
            console.error('Error listing members:', error.response?.data || error.message);
            return [];
        }
    }
};

module.exports = { circleService, SPACE_GROUPS };
