const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ CRITICAL: DATABASE_URL is missing.");
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS leads (
    email VARCHAR(255) PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    program_slug VARCHAR(100),
    answers JSONB DEFAULT '{}',
    trainerize_id VARCHAR(100),
    ghl_contact_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function initDB() {
    try {
        console.log("Connecting to database...");
        await pool.query(createTableQuery);
        console.log("✅ Table 'leads' created successfully or already exists.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error initializing database:", err);
        process.exit(1);
    }
}

initDB();
