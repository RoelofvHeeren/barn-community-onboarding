require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Stripe = require('stripe');
const { createClient, activateProgram, deactivateClient } = require('./services/trainerize');
const { syncContact, manageTags, updatePipelineStage } = require('./services/ghl');
const { sendEvent } = require('./services/meta');
const db = require('./db');
const PROGRAM_MAPPING = require('./config/programs');
// ... (rest of imports)

// ... inside handleNewSubscription ...


// ... (rest of imports)

const app = express();
console.log('--- SERVER RESTARTED WITH NODEMAILER ---', new Date().toISOString());
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PORT = process.env.PORT || 3000;

// Check for critical env vars
if (!process.env.STRIPE_SECRET_KEY) {
    console.error("❌ CRITICAL: STRIPE_SECRET_KEY is missing from environment variables.");
}
if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("❌ CRITICAL: STRIPE_WEBHOOK_SECRET is missing from environment variables.");
}
if (!process.env.VITE_TRAINERIZE_GROUP_ID && !process.env.TRAINERIZE_GROUP_ID) {
    console.error("❌ CRITICAL: TRAINERIZE_GROUP_ID is missing from environment variables. Trainerize integration will FAIL.");
}
if (!process.env.VITE_TRAINERIZE_API_TOKEN && !process.env.TRAINERIZE_API_TOKEN) {
    console.error("❌ CRITICAL: TRAINERIZE_API_TOKEN is missing from environment variables. Trainerize integration will FAIL.");
}

// Use JSON parser for all non-webhook routes
app.use((req, res, next) => {
    if (req.originalUrl === '/api/webhooks/stripe') {
        next();
    } else {
        bodyParser.json()(req, res, next);
    }
});

app.use(cors());

// Serve static frontend files (from ../dist)
const path = require('path');
app.use(express.static(path.join(__dirname, '../dist')));

// --- NEW SERVICE IMPORTS ---
const { circleService } = require('./services/circle'); // Import service

// --- Circle Webhook Endpoint ---
app.post('/api/webhooks/circle', async (req, res) => {
    try {
        const event = req.body;
        console.log('Received Circle Webhook:', event.topic);

        if (event.topic === 'member.created') {
            const member = event.member;
            const email = member.email;
            const circleUserId = member.id;

            console.log(`[Circle Webhook] New Member Created: ${email} (${circleUserId})`);

            // 1. Ensure they are in Silver Group (API might be redundant if added via Invite, but safeguards it)
            // SILVER ID: 820986
            await circleService.addMemberToSpaceGroup(email, 820986);

            // 2. Create Trial Record in DB
            // Calculate 7 days from now
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 7);

            try {
                await db.query(
                    `INSERT INTO circle_trials (email, circle_user_id, start_date, end_date, status) 
                     VALUES ($1, $2, $3, $4, 'active')
                     ON CONFLICT (email) DO UPDATE SET 
                     status = 'active', end_date = $4, start_date = $3`,
                    [email, circleUserId, startDate, endDate]
                );
                console.log(`[Circle Webhook] ✅ Trials: Started 7-day Silver trial for ${email}`);

                // --- NEW: FIRE META CAPI EVENT ---
                const nameParts = (member.name || '').split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';

                try {
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
                    console.log(`[Circle Webhook] ✅ Meta CAPI: StartTrial event fired for ${email}`);
                } catch (metaErr) {
                    console.error("[Circle Webhook] ❌ Meta CAPI Error:", metaErr.message);
                }

            } catch (dbError) {
                console.error("[Circle Webhook] ❌ DB Error saving trial:", dbError.message);
            }
        }
        res.status(200).send('Event Received');
    } catch (circleError) {
        console.error('Circle Webhook Error:', circleError);
        res.status(500).send('Error');
    }
});

// ... existing imports
const facebookService = require('./services/facebook');
const emailService = require('./services/email');

// --- Facebook Webhook Verification (GET) ---
app.get('/api/webhooks/facebook', (req, res) => {
    const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('[Facebook Webhook] ✅ Verified.');
            res.status(200).send(challenge);
        } else {
            console.error('[Facebook Webhook] ❌ Verification failed. Token mismatch.');
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400); // Bad Request if parameters are missing
    }
});

// --- Facebook Webhook Data (POST) ---
app.post('/api/webhooks/facebook', async (req, res) => {
    try {
        const body = req.body;

        // Check object is 'page' (standard for Lead Ads)
        if (body.object === 'page') {

            // Iterate over entries
            for (const entry of body.entry) {
                // Iterate over changes (leads)
                for (const change of entry.changes) {
                    if (change.field === 'leadgen') {
                        const leadgenId = change.value.leadgen_id;
                        const formId = change.value.form_id;

                        console.log(`[Facebook Webhook] 🚀 New Lead! Lead ID: ${leadgenId}, Form: ${formId}`);

                        // 1. Fetch Lead Details
                        try {
                            const lead = await facebookService.getLeadDetails(leadgenId);
                            const { email, full_name, phone_number } = lead;

                            if (email) {
                                console.log(`[Facebook Webhook] Processing lead for: ${email}`);

                                // 2. Create Circle Account (with random/temp password)
                                const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!'; // Simple random pass

                                // Create Member & Add to Groups (Silver+Bronze)
                                await circleService.createMember({
                                    email,
                                    name: full_name || 'New Member',
                                    password: tempPassword
                                });

                                // 3. Start Trial in DB
                                const startDate = new Date();
                                const endDate = new Date(startDate);
                                endDate.setDate(startDate.getDate() + 7); // 7 Days

                                await db.query(
                                    `INSERT INTO circle_trials (email, circle_user_id, start_date, end_date, status) 
                                     VALUES ($1, $2, $3, $4, 'active')
                                     ON CONFLICT (email) DO UPDATE SET 
                                     status = 'active', end_date = $4, start_date = $3`,
                                    [email, 'fb_generated', startDate, endDate]
                                );

                                // 4. Send Email with tempPassword
                                await emailService.sendWelcomeEmail(email, full_name, tempPassword);
                                console.log(`[Facebook Webhook] ✅ Account created & trial started for ${email}. Password sent.`);

                            } else {
                                console.warn('[Facebook Webhook] ⚠️ Lead has no email. Skipping.');
                            }

                        } catch (err) {
                            console.error('[Facebook Webhook] ❌ Error processing lead:', err.message);
                        }
                    }
                }
            }
            res.status(200).send('EVENT_RECEIVED');

        } // Close if (body.object === 'page')

    } catch (error) {
        console.error('[Facebook Webhook] Error:', error);
        if (!res.headersSent) res.sendStatus(500);
    }
});
// 1. [DEPRECATED] Create Checkout Session
// Keeping temporarily for transition, but will be removed in next version
app.post('/api/create-checkout-session', async (req, res) => {
    res.status(410).json({ error: "Checkout is now handled via Circle. Please use the community link." });
});

// 1.1 Verify Member
app.post('/api/verify-member', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    try {
        console.log(`[Verify Member] Checking Stripe for: ${email}`);
        const customers = await stripe.customers.list({
            email: email.toLowerCase().trim(),
            limit: 1,
            expand: ['data.subscriptions']
        });

        if (customers.data.length === 0) {
            console.log(`[Verify Member] ❌ Customer not found for: ${email}`);
            return res.status(404).json({ error: "Membership not found. Please use the email you signed up with." });
        }

        const customer = customers.data[0];
        const subscriptions = customer.subscriptions?.data || [];
        const activeSub = subscriptions.find(sub => ['active', 'trialing'].includes(sub.status));

        if (!activeSub) {
            console.log(`[Verify Member] ❌ No active subscription found for: ${email}`);
            return res.status(403).json({ error: "No active membership found. Please check your subscription status." });
        }

        console.log(`[Verify Member] ✅ Member verified: ${email}`);
        res.json({
            success: true,
            customer: {
                id: customer.id,
                firstName: customer.name?.split(' ')[0] || '',
                lastName: customer.name?.split(' ').slice(1).join(' ') || ''
            }
        });
    } catch (error) {
        console.error('[Verify Member] Error:', error);
        res.status(500).json({ error: "Failed to verify membership" });
    }
});

// 1.2 Activate Program (Direct)
app.post('/api/activate-program', async (req, res) => {
    const { email, programSlug, firstName, lastName, phone } = req.body;

    if (!email || !programSlug) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        console.log(`[Activate Program] 🚀 START: ${email} for ${programSlug}`);

        // 1. Re-verify membership for security
        const customers = await stripe.customers.list({
            email: email.toLowerCase().trim(),
            limit: 1,
            expand: ['data.subscriptions']
        });

        const customer = customers.data[0];
        const activeSub = customer?.subscriptions?.data?.find(sub => ['active', 'trialing'].includes(sub.status));

        if (!activeSub) {
            console.error(`[Activate Program] ❌ Security check failed: Not a member (${email})`);
            return res.status(403).json({ error: "Membership verification failed." });
        }

        // 2. Prepare data for internal handler
        const pseudoSession = {
            customer: customer.id,
            customer_email: email,
            customer_details: {
                email: email,
                name: `${firstName} ${lastName}`.trim() || customer.name
            },
            metadata: {
                programSlug: programSlug,
                firstName: firstName || customer.name?.split(' ')[0],
                lastName: lastName || customer.name?.split(' ').slice(1).join(' '),
                phone: phone
            }
        };

        // 3. Delegate to existing robust handler
        // handleNewSubscription takes care of Trainerize, GHL, Meta, Stripe Metadata and DB
        await handleNewSubscription(pseudoSession);

        console.log(`[Activate Program] ✅ SUCCESS: ${email}`);
        res.json({ success: true, message: "Program activated successfully!" });

    } catch (error) {
        console.error('[Activate Program] ❌ FAILED:', error);
        res.status(500).json({ error: "Failed to activate program" });
    }
});

// 1.3 Direct Onboard (No Stripe check)
app.post('/api/direct-onboard', async (req, res) => {
    const { email, programSlug, firstName, lastName, phone } = req.body;

    if (!email || !programSlug) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        console.log(`[Direct Onboard] 🚀 START: ${email} for ${programSlug}`);
        const key = email.toLowerCase().trim();

        // 0. Check Circle Community Validation
        const { circleService } = require('./services/circle');
        const circleMember = await circleService.searchMember(key);
        if (!circleMember) {
            console.log(`[Direct Onboard] ⚠️ Circle validation failed: ${key} not found.`);
            return res.status(403).json({
                error: "Community membership not found.",
                requireCircle: true
            });
        }

        // 1. Save lead to DB initially
        await db.query(
            `INSERT INTO leads (email, program_slug, first_name, last_name, phone, status, updated_at)
             VALUES ($1, $2, $3, $4, $5, 'active', NOW())
             ON CONFLICT (email)
             DO UPDATE SET 
                program_slug = EXCLUDED.program_slug,
                first_name = COALESCE(leads.first_name, EXCLUDED.first_name),
                last_name = COALESCE(leads.last_name, EXCLUDED.last_name),
                phone = COALESCE(leads.phone, EXCLUDED.phone),
                status = 'active',
                updated_at = NOW()`,
            [key, programSlug, firstName, lastName, phone]
        );

        // 2. Meta CAPI (Lead)
        await sendEvent('Lead', {
            email: email,
            firstName: firstName,
            lastName: lastName,
            phone: phone,
        }, {
            content_name: programSlug,
            status: 'potential'
        });

        // 3. GHL Sync
        let ghlContactId = null;
        try {
            console.log(`[Direct Onboard] Syncing ${email} to GHL...`);
            ghlContactId = await syncContact({
                email,
                firstName,
                lastName,
                phone,
                programSlug
            });

            if (ghlContactId) {
                await manageTags(ghlContactId, ['Lead Captured', 'Direct Onboard']);
                await updatePipelineStage(ghlContactId, 'Filled Out Funnel', 'open', `Direct: ${programSlug}`);
                await db.query('UPDATE leads SET ghl_contact_id = $1 WHERE email = $2', [ghlContactId, key]);
                console.log(`[Direct Onboard] ✅ Synced to GHL: ${ghlContactId}`);
            }
        } catch (ghlError) {
            console.error("[Direct Onboard] ⚠️ GHL Sync failed:", ghlError.message);
        }

        // 4. Trainerize Sync
        let trainerizeId = null;
        try {
            const programId = PROGRAM_MAPPING[programSlug];
            console.log(`[Direct Onboard] ⏳ Creating Client with program ${programId || 'none'}...`);

            const client = await createClient(
                { email, first_name: firstName, last_name: lastName, phone },
                programId
            );
            trainerizeId = client.userID || client.id;

            if (trainerizeId && programId && client.code !== '0') {
                console.log(`[Direct Onboard] Existing user, assigning program ${programId} separately...`);
                await activateProgram(trainerizeId, programId);
            }

            if (trainerizeId) {
                await db.query('UPDATE leads SET trainerize_id = $1 WHERE email = $2', [trainerizeId, key]);
                console.log(`[Direct Onboard] ✅ Successfully onboarded ${email} to Trainerize`);
            }
        } catch (error) {
            console.error("[Direct Onboard] ❌ Trainerize Sync FAILED:", error.message);
        }

        console.log(`[Direct Onboard] ✅ SUCCESS: ${email}`);
        res.json({ success: true, message: "Program activated successfully!" });

    } catch (error) {
        console.error('[Direct Onboard] ❌ FAILED:', error);
        res.status(500).json({ error: "Failed to direct onboard program" });
    }
});

// 1.5 Tracking Endpoint
app.post('/api/track', async (req, res) => {
    const { sessionId, eventType, eventData, url } = req.body;
    try {
        await db.query(
            `INSERT INTO events (session_id, event_type, event_data, url) VALUES ($1, $2, $3, $4)`,
            [sessionId, eventType, eventData || {}, url]
        );
        res.status(200).send('OK');
    } catch (err) {
        console.error('Tracking Error:', err);
        res.status(500).send('Error tracking event');
    }
});

// 1.6 Stats Endpoint
app.get('/api/stats', async (req, res) => {
    // ... inside api/stats ...
    // Simple In-Memory Cache (10 mins)
    const CACHE_TTL = 10 * 60 * 1000;
    if (global.statsCache && (Date.now() - global.statsCache.timestamp < CACHE_TTL)) {
        return res.json(global.statsCache.data);
    }

    try {
        // 1. Funnel Stats (Optimized with Cache)
        const funnelQuery = `
            SELECT event_type, COUNT(DISTINCT session_id) as count 
            FROM events 
            WHERE event_type IN ('view_welcome', 'click_manual_flow', 'click_quiz_flow', 'complete_lead_capture', 'view_results', 'click_checkout')
            GROUP BY event_type
        `;

        // 1b. Active Trials (Real Data from Leads table)
        const activeTrialsQuery = `
            SELECT COUNT(*) as count FROM leads WHERE status IN ('active', 'trialing')
        `;

        // 2. Program Recommendations
        const recommendationsQuery = `
            SELECT event_data->>'programSlug' as program, COUNT(DISTINCT session_id) as count
            FROM events
            WHERE event_type = 'view_results'
            GROUP BY event_data->>'programSlug'
        `;

        // 3. Quiz Drop-off
        const quizStepsQuery = `
            SELECT event_data->>'step' as step, COUNT(DISTINCT session_id) as count
            FROM events
            WHERE event_type = 'view_question'
            GROUP BY event_data->>'step'
            ORDER BY CAST(event_data->>'step' AS INTEGER) ASC
        `;

        const [funnel, activeTrialsRes, recommendations, quizSteps] = await Promise.all([
            db.query(funnelQuery),
            db.query(activeTrialsQuery),
            db.query(recommendationsQuery),
            db.query(quizStepsQuery)
        ]);

        const activeTrials = parseInt(activeTrialsRes.rows[0].count, 10);

        const responseData = {
            funnel: funnel.rows,
            activeTrials: activeTrials,
            recommendations: recommendations.rows,
            quizSteps: quizSteps.rows
        };

        // Update Cache
        global.statsCache = {
            timestamp: Date.now(),
            data: responseData
        };

        res.json(responseData);

    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Save generic lead (intent capture)
// Save generic lead (intent capture)
app.post('/api/save-lead', async (req, res) => {
    const { email, programSlug, firstName, lastName, phone } = req.body;

    if (!email || !programSlug) {
        return res.status(400).json({ error: 'Missing email or programSlug' });
    }

    const key = email.toLowerCase().trim();

    try {
        const result = await db.query(
            `INSERT INTO leads (email, program_slug, first_name, last_name, phone, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             ON CONFLICT (email)
             DO UPDATE SET 
                program_slug = EXCLUDED.program_slug,
                first_name = COALESCE(leads.first_name, EXCLUDED.first_name),
                last_name = COALESCE(leads.last_name, EXCLUDED.last_name),
                phone = COALESCE(leads.phone, EXCLUDED.phone),
                updated_at = NOW()
             RETURNING *`,
            [key, programSlug, firstName, lastName, phone]
        );
        const currentLead = result.rows.length > 0 ? result.rows[0] : null; // Access the result from INSERT/UPDATE if needed, or use input

        // 5. Meta CAPI: Lead
        await sendEvent('Lead', {
            email: email,
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            fbp: req.body.fbp,
            fbc: req.body.fbc
        }, {
            content_name: programSlug,
            status: 'potential'
        });

        // 6. GHL Sync: Lead (Immediate)
        try {
            console.log(`[Save Lead] Syncing ${email} to GHL...`);
            const ghlId = await syncContact({
                email,
                firstName,
                lastName,
                phone,
                programSlug
            });

            if (ghlId) {
                // Update DB with GHL ID
                await db.query('UPDATE leads SET ghl_contact_id = $1 WHERE email = $2', [ghlId, key]);

                // Add "Lead" tag
                await manageTags(ghlId, ['Lead Captured']);

                // Add to Pipeline: Filled Out Funnel
                await updatePipelineStage(ghlId, 'Filled Out Funnel', 'open', `Lead: ${programSlug}`);

                console.log(`[Save Lead] ✅ Synced to GHL: ${ghlId}`);
            }
        } catch (ghlError) {
            console.error("[Save Lead] ⚠️ GHL Sync successful but failed to tag/update:", ghlError.message);
        }

        console.log(`Lead saved to DB: ${key} -> ${programSlug}`);
        res.json({ success: true });
    } catch (err) {
        console.error("Error saving lead to DB:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// 2. Stripe Webhook
app.post('/api/webhooks/stripe', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Log every incoming event for debugging
    const eventObj = event.data.object;
    console.log(`\n[Webhook] ━━━ Incoming Event: ${event.type} ━━━`);
    console.log(`[Webhook] Event ID: ${event.id}`);
    console.log(`[Webhook] Object ID: ${eventObj.id}`);
    console.log(`[Webhook] Customer: ${eventObj.customer || eventObj.customer_email || 'N/A'}`);
    console.log(`[Webhook] Metadata:`, JSON.stringify(eventObj.metadata || {}, null, 2));

    // Handle Events
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                console.log('[Webhook] ✅ Checkout Completed:', session.customer_email);
                await handleNewSubscription(session);
                break;

            case 'customer.subscription.created':
                const newSub = event.data.object;
                console.log('[Webhook] ✅ Subscription Created:', newSub.id);
                await handleSubscriptionCreated(newSub);
                break;

            case 'customer.subscription.updated':
                const subUpdated = event.data.object;
                await handleSubscriptionUpdated(subUpdated, event.data.previous_attributes);
                break;

            case 'invoice.payment_failed':
                const invoice = event.data.object;
                console.log('[Webhook] ⚠️ Payment Failed:', invoice.customer_email);
                await handlePaymentFailure(invoice);
                break;

            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                await handleSubscriptionCancelled(subscription);
                break;

            default:
                console.log(`[Webhook] ℹ️ Unhandled event type: ${event.type}`);
        }
        res.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// --- Handlers ---

// --- Helper: Deactivate User from Stripe Reference ---
async function deactivateUserFromStripeReference(stripeCustomerId, userEmail, context = 'Deactivation') {
    let trainerizeId = null;
    let ghlContactId = null;
    let resolvedEmail = userEmail;

    console.log(`[${context}] ⏳ Starting deactivation for Stripe Customer ${stripeCustomerId} / Email ${userEmail}`);

    // 1. Resolve IDs from Stripe Metadata
    if (stripeCustomerId) {
        try {
            const customer = await stripe.customers.retrieve(stripeCustomerId);
            resolvedEmail = resolvedEmail || customer.email;
            if (customer.metadata) {
                trainerizeId = customer.metadata.trainerizeId;
                ghlContactId = customer.metadata.ghlContactId;
            }
        } catch (e) {
            console.error(`[${context}] Error fetching stripe customer:`, e.message);
        }
    }

    // 2. Fallback: DB
    if ((!trainerizeId || !ghlContactId) && resolvedEmail) {
        const key = resolvedEmail.toLowerCase().trim();
        try {
            const result = await db.query('SELECT trainerize_id, ghl_contact_id FROM leads WHERE email = $1', [key]);
            if (result.rows.length > 0) {
                const lead = result.rows[0];
                trainerizeId = trainerizeId || lead.trainerize_id;
                ghlContactId = ghlContactId || lead.ghl_contact_id;
            }
        } catch (e) {
            console.error(`[${context}] DB Error:`, e);
        }
    }

    // 3. Deactivate Trainerize
    if (trainerizeId) {
        try {
            await deactivateClient(trainerizeId);
            console.log(`[${context}] ✅ Deactivated Trainerize User ${trainerizeId}`);
        } catch (e) {
            console.error(`[${context}] ❌ Failed to deactivate user ${trainerizeId}:`, e.message);
        }
    } else {
        console.warn(`[${context}] ⚠️  No Trainerize ID found for ${resolvedEmail}, cannot deactivate.`);
    }

    // 4. Update GHL to "Lost"
    if (ghlContactId) {
        try {
            await updatePipelineStage(ghlContactId, 'Lost', 'lost');
            // Remove trial tag if it exists
            await manageTags(ghlContactId, [], ['Trial Community']);
            console.log(`[${context}] ✅ Marked GHL Opportunity as Lost for ${ghlContactId}`);
        } catch (e) {
            console.error(`[${context}] ❌ Failed to update GHL:`, e.message);
        }
    }
}

async function handleNewSubscription(session) {
    const { customer_email, customer_details } = session;
    const userEmail = customer_email || customer_details?.email;

    console.log(`[Stripe Handler] 🚀 START: processing new subscription for ${userEmail}`);

    // Fallbacks
    let programSlug = session.metadata?.programSlug;
    let firstName = session.metadata?.firstName || customer_details?.name?.split(' ')[0] || 'Member';
    let lastName = session.metadata?.lastName || customer_details?.name?.split(' ').slice(1).join(' ') || '';
    let phone = session.metadata?.phone || customer_details?.phone;

    console.log(`[Stripe Handler] Metadata Init: Program=${programSlug}, Name=${firstName} ${lastName}`);

    // 1. If no program slug in metadata, check our DB bridge
    const key = userEmail?.toLowerCase().trim();
    let leadData = {};

    console.log(`[Stripe Handler] Looking up intent in DB for key: ${key}`);

    if (key) {
        try {
            const result = await db.query('SELECT * FROM leads WHERE email = $1', [key]);
            if (result.rows.length > 0) {
                console.log(`[Stripe Handler] ✅ Found pending lead! Bridging data...`);
                leadData = result.rows[0];
                programSlug = programSlug || leadData.program_slug;
                if (firstName === 'Member') firstName = leadData.first_name || firstName;
                if (!lastName) lastName = leadData.last_name || '';
                // Note: answers are stored as JSONB in DB
                leadData.answers = leadData.answers || {};

                console.log(`[Stripe Handler] Enhanced Data: Program=${programSlug}, Name=${firstName} ${lastName}`);
            } else {
                console.log(`[Stripe Handler] No pending lead found locally.`);
            }
        } catch (err) {
            console.error("[Stripe Handler] DB Error lookup:", err);
        }
    }

    // 2. Execute Integrations
    // FALLBACK: If programSlug is still missing (e.g. direct Circle signup), default to 'sculpt-tone' or 'barn-community'
    if (!programSlug) {
        programSlug = 'sculpt-tone'; // Default Program
        console.warn(`[Stripe Handler] ⚠️ No program slug found. Defaulting to '${programSlug}' to ensure GHL/Meta sync.`);
    }

    if (userEmail && programSlug) {
        console.log(`[Stripe Handler] ⚡ Executes Integrations for: ${userEmail}, Program: ${programSlug}`);

        let trainerizeId = null;
        let ghlContactId = null;

        // A. GoHighLevel Sync (Leads -> Trial)
        try {
            console.log("[GHL Sync] ⏳ Starting syncContact...");
            // Combine data from session and lead store (quiz answers)
            const fullUserData = {
                email: userEmail,
                firstName,
                lastName,
                phone,
                programSlug,
                answers: leadData.answers || {} // Pass quiz answers if available
            };

            ghlContactId = await syncContact(fullUserData);
            console.log(`[GHL Sync] ✅ Contact Synced. ID: ${ghlContactId}`);

            if (ghlContactId) {
                // Add "Trial Community" Tag
                console.log("[GHL Sync] Adding Tag: Trial Community");
                await manageTags(ghlContactId, ['Trial Community']);

                // Create Opportunity "On Trial"
                console.log("[GHL Sync] Updating Stage: On Trial");
                await updatePipelineStage(ghlContactId, 'On Trial', 'open', `${firstName} ${lastName}`.trim());

                // 3. Meta CAPI: StartTrial
                await sendEvent('StartTrial', {
                    email: userEmail,
                    phone: phone,
                    firstName: firstName,
                    lastName: lastName
                }, {
                    status: 'trialing',
                    content_name: resolvedProgramSlug,
                    currency: 'GBP',
                    value: 0.00
                }, session.id); // Use Session ID as Event ID for Deduplication

                console.log(`[GHL Sync] Setup Complete for ${userEmail}`);
            }

        } catch (e) {
            console.error("[GHL Sync] ❌ FAILED:", e.message);
        }

        // B. Trainerize Sync
        try {
            const programId = PROGRAM_MAPPING[programSlug];
            console.log(`[Trainerize Sync] ⏳ Creating Client with program ${programId || 'none'}...`);

            // Pass programId to createClient so training plan is copied inline
            // This is the ONLY reliable way to assign training plan content
            const client = await createClient(
                { email: userEmail, first_name: firstName, last_name: lastName, phone },
                programId
            );
            trainerizeId = client.userID || client.id;

            console.log(`[Trainerize Sync] Client Created. ID: ${trainerizeId}`);

            // If user already existed (409 fallback), program wasn't assigned inline
            // Try activateProgram as fallback
            if (trainerizeId && programId && client.code !== '0') {
                console.log(`[Trainerize Sync] Existing user, assigning program ${programId} separately...`);
                await activateProgram(trainerizeId, programId);
            }

            if (trainerizeId) {
                console.log(`[Trainerize Sync] ✅ Successfully onboarded ${userEmail}`);
            } else {
                console.error("[Trainerize Sync] ❌ No User ID returned", { programSlug });
            }
        } catch (e) {
            console.error("[Trainerize Sync] ❌ FAILED:", e.message);
        }

        // C. Resilience: Store External IDs in Stripe Metadata & Local
        if (session.customer && (trainerizeId || ghlContactId)) {
            try {
                console.log(`[Stripe Metadata] Updating Customer ${session.customer}...`);
                await stripe.customers.update(session.customer, {
                    metadata: {
                        trainerizeId: String(trainerizeId || ''),
                        ghlContactId: String(ghlContactId || ''),
                        currentProgramSlug: programSlug
                    }
                });
                console.log(`[Stripe Metadata] ✅ Updated. TID: ${trainerizeId}, GHL: ${ghlContactId}`);
            } catch (stripeError) {
                console.error("[Stripe Metadata] ❌ Failed to update:", stripeError.message);
            }
        }

        // Update DB Record (UPSERT to ensure payment is recorded even if lead didn't exist)
        if (key) {
            console.log("[DB] Updating user record...");
            try {
                await db.query(
                    `INSERT INTO leads (email, trainerize_id, ghl_contact_id, status, program_slug, first_name, last_name, phone, updated_at)
                                         VALUES ($1, $2, $3, 'active', $4, $5, $6, $7, NOW())
                                         ON CONFLICT (email) DO UPDATE SET 
                                         trainerize_id = EXCLUDED.trainerize_id, 
                                         ghl_contact_id = EXCLUDED.ghl_contact_id, 
                                         status = 'active', 
                                         updated_at = NOW()`,
                    [key, trainerizeId, ghlContactId, programSlug, firstName, lastName, phone]
                );
                console.log("[DB] Saved (UPSERT).");
            } catch (err) {
                console.error("[DB] Failed to update user record:", err);
            }
        }

    } else {
        console.warn(`[Stripe Handler] ⚠️ Skipping integrations: Missing email (${userEmail}) or program slug (${programSlug})`);
    }

    console.log(`[Stripe Handler] 🏁 END: finished processing for ${userEmail}`);
}

// --- NEW: Handle customer.subscription.created (fallback for checkout.session.completed) ---
async function handleSubscriptionCreated(subscription) {
    const customerId = subscription.customer;
    const programSlug = subscription.metadata?.programSlug;

    console.log(`[Sub Created] 🚀 START: Processing new subscription ${subscription.id}`);
    console.log(`[Sub Created] Customer ID: ${customerId}, Status: ${subscription.status}`);
    console.log(`[Sub Created] Program from metadata: ${programSlug || 'NONE'}`);

    if (!customerId) {
        console.error('[Sub Created] ❌ No customer ID on subscription, cannot proceed.');
        return;
    }

    // 1. Resolve customer email from Stripe
    let userEmail, customerName;
    try {
        const customer = await stripe.customers.retrieve(customerId);
        userEmail = customer.email;
        customerName = customer.name || '';
        console.log(`[Sub Created] Resolved customer: ${userEmail} (${customerName})`);
    } catch (e) {
        console.error('[Sub Created] ❌ Failed to retrieve Stripe customer:', e.message);
        return;
    }

    if (!userEmail) {
        console.error('[Sub Created] ❌ No email found on Stripe customer, cannot proceed.');
        return;
    }

    // 2. Check if this user was already processed (avoid double-processing with checkout.session.completed)
    const key = userEmail.toLowerCase().trim();
    let leadData = {};
    let alreadyProcessed = false;

    try {
        const result = await db.query('SELECT * FROM leads WHERE email = $1', [key]);
        if (result.rows.length > 0) {
            leadData = result.rows[0];
            // If already has a trainerize_id, skip to avoid duplicate invites
            if (leadData.trainerize_id) {
                console.log(`[Sub Created] ⏭️ User already has Trainerize ID (${leadData.trainerize_id}), skipping.`);
                alreadyProcessed = true;
            }
        }
    } catch (err) {
        console.error('[Sub Created] DB lookup error:', err.message);
    }

    if (alreadyProcessed) {
        console.log(`[Sub Created] 🏁 END: Already processed, skipping ${userEmail}`);
        return;
    }

    // 3. Build a session-like object so we can reuse handleNewSubscription
    const resolvedProgramSlug = programSlug || leadData.program_slug;
    const nameParts = customerName.split(' ');
    const firstName = leadData.first_name || nameParts[0] || 'Member';
    const lastName = leadData.last_name || nameParts.slice(1).join(' ') || '';

    console.log(`[Sub Created] Resolved: Email=${userEmail}, Program=${resolvedProgramSlug}, Name=${firstName} ${lastName}`);

    if (!resolvedProgramSlug) {
        console.error(`[Sub Created] ❌ No program slug found in subscription metadata or DB for ${userEmail}`);
        return;
    }

    // 4. Build a pseudo-session object and delegate to existing handler
    const pseudoSession = {
        customer: customerId,
        customer_email: userEmail,
        customer_details: { email: userEmail, name: customerName },
        metadata: {
            programSlug: resolvedProgramSlug,
            userEmail: userEmail,
            firstName: firstName,
            lastName: lastName
        }
    };

    console.log(`[Sub Created] Delegating to handleNewSubscription...`);
    await handleNewSubscription(pseudoSession);
    console.log(`[Sub Created] 🏁 END: Finished processing ${userEmail}`);
}

async function handleSubscriptionUpdated(subscription, previousAttributes) {
    // Check for Trial -> Active Conversion
    if (subscription.status === 'active' && previousAttributes?.status === 'trialing') {
        console.log(`Subscription converted to ACTIVE for ${subscription.customer}`);

        // Resolve GHL ID
        let ghlContactId = null;
        let programSlug = '';

        try {
            const customer = await stripe.customers.retrieve(subscription.customer);
            ghlContactId = customer.metadata?.ghlContactId;
            programSlug = customer.metadata?.currentProgramSlug || '';

            // Fallback: Check DB if not in metadata
            if (!ghlContactId) {
                const key = customer.email?.toLowerCase().trim();
                try {
                    const result = await db.query('SELECT ghl_contact_id FROM leads WHERE email = $1', [key]);
                    if (result.rows.length > 0) {
                        ghlContactId = result.rows[0].ghl_contact_id;
                    }
                } catch (e) { console.error("[Update Sub] DB Error:", e); }
            }

            if (ghlContactId) {
                console.log(`Converting GHL Contact ${ghlContactId}...`);

                // 1. Remove Trial Tag
                await manageTags(ghlContactId, [], ['Trial Community']);

                // 2. Determine Stage (Member vs Online Coaching)
                // Logic: If program/description contains "gold"
                // Checking programSlug is easiest if it reflects the plan
                let targetStage = 'Member';
                if (programSlug.toLowerCase().includes('gold')) {
                    targetStage = 'Online Coaching';
                }

                // 3. Update Opportunity
                // We need names - if we don't have them in scope easily (we don't here without another lookup or passing them)
                // We can try to use customer.name from stripe if available
                const fullName = customer.name || 'Barn Member';
                await updatePipelineStage(ghlContactId, targetStage, 'won', fullName);
                console.log(`Moved to stage: ${targetStage}`);

                // 4. Meta CAPI: Purchase (Trial Conversion)
                await sendEvent('Purchase', {
                    email: subscription.customer_email || customer.email,
                    phone: customer.phone,
                    firstName: fullName.split(' ')[0],
                    lastName: fullName.split(' ').slice(1).join(' ')
                }, {
                    currency: 'GBP',
                    value: 23.99, // Hardcoded for now, or fetch from invoice
                    content_name: 'Barn Community Membership',
                    status: 'active'
                }, subscription.id); // Use Subscription ID as Event ID for Deduplication

            } else {
                console.warn("No GHL ID found for converted subscription.");
            }

        } catch (e) {
            console.error("Error handling subscription update:", e.message);
        }
    }

    // Check for Trial -> Failed/Unpaid/Cancelled (Trial Expired without payment)
    if (previousAttributes?.status === 'trialing' && ['past_due', 'unpaid', 'canceled', 'incomplete_expired'].includes(subscription.status)) {
        console.log(`[Sub Update] ⚠️ Trial expired without conversion for ${subscription.customer} (Status: ${subscription.status})`);
        await deactivateUserFromStripeReference(subscription.customer, null, 'Trial Expiration');
    }
}

async function handlePaymentFailure(invoice) {
    const email = invoice.customer_email;
    const customerId = invoice.customer;
    console.log(`[Payment Failed] ⚠️ Handling failure for ${email || customerId}`);

    // Deactivate user immediately on payment failure
    await deactivateUserFromStripeReference(customerId, email, 'Payment Failure');
}

async function handleSubscriptionCancelled(subscription) {
    console.log(`[Sub Cancelled] ⚠️ Processing cancellation for ${subscription.customer}`);
    await deactivateUserFromStripeReference(subscription.customer, null, 'Subscription Cancelled');
}



// 3. Catch-all: Serve React App for any other route
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = {
    handleNewSubscription,
    handleSubscriptionCreated,
    handlePaymentFailure,
    handleSubscriptionCancelled,
    handleSubscriptionUpdated
};
