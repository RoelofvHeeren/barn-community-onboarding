require('dotenv').config();
const db = require('../db');
const { circleService, SPACE_GROUPS } = require('../services/circle');
const { sendEvent } = require('../services/meta');

// Force exit after 30 seconds to prevent hanging
setTimeout(() => {
    console.error('⚠️ Script timed out after 30s! Forcing exit.');
    process.exit(1);
}, 30000);

async function checkTrials() {
    console.log('--- Starting Circle Automation Script (Verbose) ---');
    console.log(`Time: ${new Date().toISOString()}`);

    try {
        // ==========================================
        // STEP 1: POLL FOR NEW MEMBERS (Onboarding)
        // ==========================================
        console.log('1. Polling for new members...');
        const recentMembers = await circleService.listMembers(50); // Get last 50 members
        console.log(`   > Fetched ${recentMembers.length} members from Circle.`);

        for (const member of recentMembers) {
            const { email, id: circleUserId, created_at, name } = member;

            // SECURITY CHECK: Only process members created in the last 24 hours.
            const joinDate = new Date(created_at);
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

            if (joinDate < oneDayAgo) {
                // Member joined more than 24 hours ago, skip them silent or verbose?
                // console.log(`   - Skipping old member: ${email} (${created_at})`);
                continue;
            }

            console.log(`   - Processing RECENT member: ${email} (${created_at})`);

            // Check if this member is already tracked in our DB
            console.log(`     > Checking DB for existing trial...`);
            const existingTrial = await db.query('SELECT * FROM circle_trials WHERE email = $1', [email]);

            if (existingTrial.rows.length === 0) {
                console.log(`     > 🆕 Found untracked member: ${email} (${name})`);

                // Add to Silver Group
                console.log(`     > Adding to Silver Space Group...`);
                await circleService.addMemberToSpaceGroup(email, SPACE_GROUPS.SILVER);
                console.log(`     > DONE adding to Silver.`);

                // Create Trial Record
                const startDate = new Date();
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 7); // 7 Days trial

                console.log(`     > Inserting trial record into DB...`);
                await db.query(
                    `INSERT INTO circle_trials (email, circle_user_id, start_date, end_date, status) 
                     VALUES ($1, $2, $3, $4, 'active')`,
                    [email, circleUserId, startDate, endDate]
                );
                console.log(`     > ✅ Started 7-Day Silver Trial for ${email}`);

                // --- NEW: FIRE META CAPI EVENT ---
                const nameParts = (name || '').split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';

                try {
                    console.log(`     > Firing Meta CAPI StartTrial event...`);
                    await sendEvent('StartTrial', {
                        email: email,
                        firstName: firstName,
                        lastName: lastName
                    }, {
                        status: 'trialing',
                        content_name: 'Barn Community Membership - Direct Join',
                        value: 0.00,
                        currency: 'GBP'
                    }, `circle_join_${circleUserId}`);
                    console.log(`     > ✅ Meta CAPI Event Fired.`);
                } catch (metaErr) {
                    console.error("     > ❌ Meta CAPI Error:", metaErr.message);
                }
            } else {
                console.log(`     > Member already tracked. Skipping.`);
            }
        }

        // ==========================================
        // STEP 2: CHECK EXPIRED TRIALS (Offboarding)
        // ==========================================
        console.log('2. Checking for expired trials...');

        const result = await db.query(
            `SELECT * FROM circle_trials 
             WHERE status = 'active' AND end_date < NOW()`
        );

        const expiredTrials = result.rows;
        console.log(`   > Found ${expiredTrials.length} expired trials.`);

        for (const trial of expiredTrials) {
            const { email } = trial;
            console.log(`   - Checking expiration for ${email}...`);

            // Check Payment Status (Local DB + Circle Tags)
            let isPaid = false;

            // A. Check Local DB (Primary Truth)
            try {
                const leadRes = await db.query("SELECT status FROM leads WHERE email = $1", [email]);
                if (leadRes.rows.length > 0) {
                    const status = leadRes.rows[0].status;
                    if (status === 'active' || status === 'member') {
                        isPaid = true;
                        console.log(`     > [DB] User is '${status}'. Safe.`);
                    }
                }
            } catch (err) {
                console.error("     > Error checking local DB:", err);
            }

            // B. Check Circle Tags (Secondary Truth)
            if (!isPaid) {
                const member = await circleService.searchMember(email);
                if (member) {
                    const tags = member.member_tags || [];
                    if (tags.includes("Paid Member") || tags.includes("Lifetime")) {
                        isPaid = true;
                        console.log(`     > [Circle] User has 'Paid Member' tag.`);
                    }
                }
            }

            if (isPaid) {
                console.log(`     > User is PAID. marking completed.`);
                await db.query(`UPDATE circle_trials SET status = 'completed' WHERE email = $1`, [email]);
            } else {
                console.log(`     > User is NOT paid. Downgrading...`);

                // Ensure they are in Bronze (Downgrade target)
                await circleService.addMemberToSpaceGroup(email, SPACE_GROUPS.BRONZE);

                // Remove from Silver Group
                await circleService.removeMemberFromSpaceGroup(email, SPACE_GROUPS.SILVER);

                // Update DB
                await db.query(`UPDATE circle_trials SET status = 'downgraded' WHERE email = $1`, [email]);
                console.log(`     > 📉 Downgraded ${email} to Bronze only.`);
            }
        }

    } catch (error) {
        console.error('❌ Error in Automation Script:', error);
    } finally {
        console.log('--- Script Finished ---');
        // db.js handles internal pool, we just exit.
        process.exit(0);
    }
}

checkTrials();
