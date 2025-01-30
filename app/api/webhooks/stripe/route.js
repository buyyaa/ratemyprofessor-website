import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import nodemailer from 'nodemailer';
import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';

// Remove edge runtime since we're using Node.js features
// export const runtime = 'edge';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Email configuration
const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER);

// Define Stripe price IDs and their corresponding configurations
const PRICE_CONFIGS = {
    'price_1QmUNjRx1RbwTEuJ585357jc': { 
        tokens: 30, 
        tier: 'basic', 
        price: 99,
        name: '30 Tokens Package'
    },
    'price_1Qmkm1Rx1RbwTEuJMWHZO0iS': { 
        tokens: 90, 
        tier: 'basic', 
        price: 199,
        name: '90 Tokens Package'
    },
    'price_1Qmkn9Rx1RbwTEuJJi5mDzKo': { 
        tokens: -1, 
        tier: 'pro', 
        price: 1000,
        name: 'Unlimited Pro Package'
    }
};

async function sendEmail(email, productConfig) {
    try {
        const tokenText = productConfig.tokens === -1 ? 'unlimited tokens' : `${productConfig.tokens} tokens`;
        
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `Purchase Confirmation - ${productConfig.name}`,
            html: `
                <h2>Thank you for your purchase!</h2>
                <p>Your account has been credited with ${tokenText}.</p>
                ${productConfig.tier === 'pro' ? '<p>You now have access to all Pro features!</p>' : ''}
                <p>You can now use these tokens in the Professor Rater Pro extension.</p>
                <br>
                <p>Best regards,</p>
                <p>The Professor Rater Pro Team</p>
            `
        });
    } catch (error) {
        console.error('Email sending error:', error);
    }
}

export async function POST(req) {
    try {
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');

        let event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
            console.log('Event type:', event.type);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            
            try {
                // Get the session with expanded data
                const checkoutSession = await stripe.checkout.sessions.retrieve(session.id, {
                    expand: ['line_items.data.price']
                });
                
                // Get customer email from session details
                const customerEmail = checkoutSession.customer_details?.email;
                if (!customerEmail) {
                    throw new Error('No customer email found in session');
                }
                
                console.log('Processing purchase for email:', customerEmail);

                // Get the price ID from the line items
                const priceId = checkoutSession.line_items?.data[0]?.price?.id;
                if (!priceId) {
                    throw new Error('No price ID found in session');
                }

                console.log('Price ID:', priceId);
                
                // Get the configuration for this price
                const config = PRICE_CONFIGS[priceId];
                if (!config) {
                    throw new Error(`Unknown price ID: ${priceId}`);
                }

                // Connect to MongoDB
                const client = await clientPromise;
                const db = client.db('ratemyprofessor-db');
                const users = db.collection('users');

                // Generate extension API key
                const extensionApiKey = crypto.randomUUID();

                // Update or create user document
                const updateDoc = {
                    $setOnInsert: {
                        email: customerEmail,
                        createdAt: new Date(),
                    },
                    $set: {
                        extensionApiKey,
                        subscriptionStatus: config.tier,
                        tokens: config.tokens,
                        updatedAt: new Date()
                    }
                };

                const result = await users.findOneAndUpdate(
                    { email: customerEmail },
                    updateDoc,
                    { 
                        upsert: true,
                        returnDocument: 'after'
                    }
                );

                console.log('MongoDB update successful:', result);

                // Send confirmation email
                const tokenText = config.tokens === -1 ? 'unlimited tokens' : `${config.tokens} tokens`;
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM,
                    to: customerEmail,
                    subject: `Purchase Confirmation - ${config.name}`,
                    html: `
                        <h2>Thank you for your purchase!</h2>
                        <p>Your account has been credited with ${tokenText}.</p>
                        <p>Your extension API key: ${extensionApiKey}</p>
                        <p>You can now use these tokens in the Professor Rater Pro extension.</p>
                        <br>
                        <p>Best regards,</p>
                        <p>The Professor Rater Pro Team</p>
                    `
                });

                console.log('Email sent successfully');

            } catch (error) {
                console.error('Error processing webhook:', error);
                return NextResponse.json({ error: error.message }, { status: 400 });
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}