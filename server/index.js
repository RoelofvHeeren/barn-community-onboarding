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

const PORT = process.env.PORT || 3001;

// --- Routes ---

// 1. Create Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
    const { priceId, successUrl, cancelUrl, userEmail, programSlug } = req.body;

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
                userEmail: userEmail
            }
        });

        res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
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

async function handleNewSubscription(session) {
    const { userEmail, programSlug } = session.metadata || {};
    // 1. Create User in Trainerize (if not exists)
    // 2. Subscribe/Activate Program
    if (userEmail && programSlug) {
        try {
            const client = await createClient({ email: userEmail, first_name: 'New', last_name: 'Member' }); // Use placeholder names or stored metadata
            await activateProgram(client.id, programSlug);
            console.log(`Activated ${programSlug} for ${userEmail}`);
        } catch (e) {
            console.error("Failed to activate Trainerize:", e.message);
        }
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

async function handleSubscriptionCancelled(sub) {
    // Logic to deactivate
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
