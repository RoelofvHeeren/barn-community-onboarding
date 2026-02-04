require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Stripe = require('stripe');
const { createClient, activateProgram, deactivateClient } = require('./services/trainerize');
const { syncContact, manageTags, updatePipelineStage } = require('./services/ghl');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

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

const PORT = process.env.PORT || 3001;

// --- Routes ---

// 1. Create Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
    const { priceId, successUrl, cancelUrl, userEmail, programSlug, firstName, lastName, phone } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [
                {
                    price: priceId, // The Stripe Price ID for the subscription
                    quantity: 1,
                },
            ],
            subscription_data: {
                trial_period_days: 7, // 7 Day Free Trial
                metadata: {
                    programSlug: programSlug // Pass program info to handle activation later
                }
            },
            customer_email: userEmail,
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                programSlug: programSlug, // Access in session completed
                userEmail: userEmail,
                firstName: firstName,
                lastName: lastName,
                phone: phone
            }
        });

        res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save generic lead (intent capture)
app.post('/api/save-lead', (req, res) => {
    const { email, programSlug, firstName, lastName } = req.body;

    if (!email || !programSlug) {
        return res.status(400).json({ error: 'Missing email or programSlug' });
    }

    const users = getStoredUsers();

    // Key by email (lowercase)
    const key = email.toLowerCase().trim();

    users[key] = {
        ...(users[key] || {}),
        email: key,
        firstName: firstName || users[key]?.firstName,
        lastName: lastName || users[key]?.lastName,
        programSlug: programSlug, // Store the intended program
        updatedAt: new Date().toISOString()
    };

    saveStoredUsers(users);
    console.log(`Lead saved: ${key} -> ${programSlug}`);

    res.json({ success: true });
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

    // Handle Events
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                console.log('Checkout Completed:', session.customer_email);
                await handleNewSubscription(session);
                break;

            case 'customer.subscription.updated':
                const subUpdated = event.data.object;
                await handleSubscriptionUpdated(subUpdated, event.data.previous_attributes);
                break;

            case 'invoice.payment_failed':
                const invoice = event.data.object;
                console.log('Payment Failed:', invoice.customer_email);
                await handlePaymentFailure(invoice);
                break;

            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                await handleSubscriptionCancelled(subscription);
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        res.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// --- Handlers ---

const PROGRAM_MAPPING = require('./config/programs');

async function handleNewSubscription(session) {
    const { customer_email, customer_details } = session;
    const userEmail = customer_email || customer_details?.email;

    // Fallbacks
    let programSlug = session.metadata?.programSlug;
    let firstName = session.metadata?.firstName || customer_details?.name?.split(' ')[0] || 'Member';
    let lastName = session.metadata?.lastName || customer_details?.name?.split(' ').slice(1).join(' ') || '';
    let phone = session.metadata?.phone || customer_details?.phone;

    // 1. If no program slug in metadata, check our local "users.json" bridge
    const users = getStoredUsers();
    const key = userEmail?.toLowerCase().trim();
    let leadData = {};

    if (key && users[key]) {
        console.log(`Found pending lead for ${key}, bridging data...`);
        leadData = users[key];
        programSlug = programSlug || leadData.programSlug;
        if (firstName === 'Member') firstName = leadData.firstName || firstName;
        if (!lastName) lastName = leadData.lastName || '';
    }

    // 2. Execute Integrations
    if (userEmail && programSlug) {
        console.log(`Processing new subscription for: ${userEmail}, Program: ${programSlug}`);

        let trainerizeId = null;
        let ghlContactId = null;

        // A. GoHighLevel Sync (Leads -> Trial)
        try {
            console.log("Syncing to GHL...");
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

            if (ghlContactId) {
                // Add "Trial Community" Tag
                await manageTags(ghlContactId, ['Trial Community']);

                // Create Opportunity "On Trial"
                await updatePipelineStage(ghlContactId, 'On Trial', 'open');

                console.log(`GHL Setup Complete for ${userEmail} (ID: ${ghlContactId})`);
            }
        } catch (e) {
            console.error("GHL Sync Failed:", e.message);
        }

        // B. Trainerize Sync
        try {
            // Create Client
            const client = await createClient({ email: userEmail, first_name: firstName, last_name: lastName, phone });
            trainerizeId = client.userID || client.id;
            const programId = PROGRAM_MAPPING[programSlug];

            if (trainerizeId && programId) {
                await activateProgram(trainerizeId, programId);
                console.log(`Successfully onboarded ${userEmail} to Trainerize`);
            } else {
                console.error("Failed to activate: Missing User ID or Program ID mapping", { trainerizeId, programSlug });
            }
        } catch (e) {
            console.error("Failed to activate Trainerize:", e.message);
        }

        // C. Resilience: Store External IDs in Stripe Metadata & Local
        if (session.customer && (trainerizeId || ghlContactId)) {
            try {
                await stripe.customers.update(session.customer, {
                    metadata: {
                        trainerizeId: String(trainerizeId || ''),
                        ghlContactId: String(ghlContactId || ''),
                        currentProgramSlug: programSlug
                    }
                });
                console.log(`Stripe Metadata Updated. TID: ${trainerizeId}, GHL: ${ghlContactId}`);
            } catch (stripeError) {
                console.error("Failed to update Stripe metadata:", stripeError.message);
            }
        }

        // Update Local Store (Optional but good for fallback)
        if (key) {
            users[key] = {
                ...(users[key] || {}),
                trainerizeId,
                ghlContactId,
                status: 'active',
                updatedAt: new Date().toISOString()
            };
            saveStoredUsers(users);
        }

    } else {
        console.warn("Skipping integrations: Missing email or program slug", { userEmail, programSlug });
    }
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

            // Fallback: Check local store if not in metadata
            if (!ghlContactId) {
                const users = getStoredUsers();
                const key = customer.email?.toLowerCase().trim();
                ghlContactId = users[key]?.ghlContactId;
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
                await updatePipelineStage(ghlContactId, targetStage, 'won');
                console.log(`Moved to stage: ${targetStage}`);

            } else {
                console.warn("No GHL ID found for converted subscription.");
            }

        } catch (e) {
            console.error("Error handling subscription update:", e.message);
        }
    }
}

async function handlePaymentFailure(invoice) {
    const email = invoice.customer_email;
    if (email) console.log(`Should deactivate user ${email} due to payment failure`);
}

async function handleSubscriptionCancelled(subscription) {
    const stripeCustomerId = subscription.customer;
    let trainerizeId = null;
    let ghlContactId = null;
    let userEmail = null;

    // 1. Resolve IDs from Stripe Metadata
    if (stripeCustomerId) {
        try {
            const customer = await stripe.customers.retrieve(stripeCustomerId);
            userEmail = customer.email;
            if (customer.metadata) {
                trainerizeId = customer.metadata.trainerizeId;
                ghlContactId = customer.metadata.ghlContactId;
            }
        } catch (e) {
            console.error("Error fetching stripe customer for cancellation:", e.message);
        }
    }

    // 2. Fallback: Local Store
    if ((!trainerizeId || !ghlContactId) && userEmail) {
        const users = getStoredUsers();
        const key = userEmail.toLowerCase().trim();
        const lead = users[key];
        if (lead) {
            trainerizeId = trainerizeId || lead.trainerizeId;
            ghlContactId = ghlContactId || lead.ghlContactId;
        }
    }

    // 3. Deactivate Trainerize
    if (trainerizeId) {
        try {
            await deactivateClient(trainerizeId);
            console.log(`Deactivated Trainerize User ${trainerizeId}`);
        } catch (e) {
            console.error(`Failed to deactivate user ${trainerizeId}:`, e.message);
        }
    }

    // 4. Update GHL to "Lost"
    if (ghlContactId) {
        try {
            await updatePipelineStage(ghlContactId, 'Lost', 'lost');
            // Optionally remove trial tag if they cancelled during trial
            await manageTags(ghlContactId, [], ['Trial Community']);
            console.log(`Marked GHL Opportunity as Lost for ${ghlContactId}`);
        } catch (e) {
            console.error(`Failed to update GHL for cancellation:`, e.message);
        }
    }
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
    handlePaymentFailure,
    handleSubscriptionCancelled,
    handleSubscriptionUpdated
};
