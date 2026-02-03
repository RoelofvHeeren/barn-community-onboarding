require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Stripe = require('stripe');
const { createClient, activateProgram, deactivateProgram } = require('./services/trainerize');

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
                // Create Trainerize Account & Activate
                await handleNewSubscription(session);
                break;

            case 'invoice.payment_failed':
                const invoice = event.data.object;
                console.log('Payment Failed:', invoice.customer_email);
                // Pause/Deactivate Trainerize
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

    if (!programSlug && key && users[key]) {
        console.log(`Found pending lead for ${key}, bridging data...`);
        const lead = users[key];
        programSlug = lead.programSlug;
        // Enrich other data if missing
        if (firstName === 'Member') firstName = lead.firstName || firstName;
        if (!lastName) lastName = lead.lastName || '';
    }

    // 2. Execute Trainerize Logic
    if (userEmail && programSlug) {
        console.log(`Processing new subscription for: ${userEmail}, Program: ${programSlug}`);
        try {
            // Create Client
            const client = await createClient({
                email: userEmail,
                first_name: firstName,
                last_name: lastName,
                phone
            });

            const trainerizeId = client.userID || client.id;
            const programId = PROGRAM_MAPPING[programSlug];

            if (trainerizeId && programId) {
                // Activate Program
                await activateProgram(trainerizeId, programId);
                console.log(`Successfully onboarded ${userEmail} to Trainerize`);

                // 3. Update local store with Trainerize ID (short-term cache)
                if (key) {
                    users[key] = {
                        ...(users[key] || {}),
                        trainerizeId: trainerizeId,
                        status: 'active',
                        updatedAt: new Date().toISOString()
                    };
                    saveStoredUsers(users);
                }

                // 4. Update Stripe Customer Metadata (long-term resilience)
                // We need the Stripe Customer ID to stick this metadata to them
                if (session.customer) {
                    try {
                        await stripe.customers.update(session.customer, {
                            metadata: {
                                trainerizeId: String(trainerizeId),
                                currentProgramSlug: programSlug
                            }
                        });
                        console.log(`Stripe Customer ${session.customer} updated with Trainerize ID: ${trainerizeId}`);
                    } catch (stripeError) {
                        console.error("Failed to update Stripe metadata:", stripeError.message);
                    }
                }

            } else {
                console.error("Failed to activate: Missing User ID or Program ID mapping", { trainerizeId, programSlug, programId });
            }
        } catch (e) {
            console.error("Failed to activate Trainerize:", e.message);
        }
    } else {
        console.warn("Skipping Trainerize activation: Missing email or program slug", { userEmail, programSlug });
    }
}

async function handlePaymentFailure(invoice) {
    // Logic to find user by email and deactivate
    const email = invoice.customer_email;
    if (email) {
        // await deactivateProgramByEmail(email); 
        console.log(`Should deactivate user ${email} due to payment failure`);
    }
}

async function handleSubscriptionCancelled(subscription) {
    const stripeCustomerId = subscription.customer;
    let trainerizeId = null;
    let userEmail = null;

    // 1. Attempt to resolve Trainerize ID from Stripe Metadata (Preferred)
    if (stripeCustomerId) {
        try {
            const customer = await stripe.customers.retrieve(stripeCustomerId);
            userEmail = customer.email;
            if (customer.metadata && customer.metadata.trainerizeId) {
                trainerizeId = customer.metadata.trainerizeId;
                console.log(`Found Trainerize ID in Stripe metadata: ${trainerizeId}`);
            }
        } catch (e) {
            console.error("Error fetching stripe customer for cancellation:", e.message);
        }
    }

    // 2. Fallback: Lookup in local store
    if (!trainerizeId && userEmail) {
        console.log("No ID in Stripe metadata, checking local store...");
        const users = getStoredUsers();
        const key = userEmail.toLowerCase().trim();
        const lead = users[key];
        if (lead && lead.trainerizeId) {
            trainerizeId = lead.trainerizeId;
        }
    }

    if (trainerizeId) {
        try {
            await deactivateClient(trainerizeId);
            console.log(`Deactivated Trainerize User ${trainerizeId} (Email: ${userEmail}) due to cancellation.`);

            // Cleanup local store if exists
            if (userEmail) {
                const users = getStoredUsers();
                const key = userEmail.toLowerCase().trim();
                if (users[key]) {
                    users[key] = { ...users[key], status: 'deactivated', cancelledAt: new Date().toISOString() };
                    saveStoredUsers(users);
                }
            }

        } catch (e) {
            console.error(`Failed to deactivate user ${trainerizeId}:`, e.message);
        }
    } else {
        console.warn(`Could not find Trainerize ID for cancelled subscription (Customer: ${stripeCustomerId}, Email: ${userEmail}). Skipping deactivation.`);
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
    handleSubscriptionCancelled
};
