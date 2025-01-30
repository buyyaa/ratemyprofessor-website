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
        console.log('Webhook received');
        
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');

        let event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
            console.log('Event verified:', event.type);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
        }

        if (event.type === 'checkout.session.completed') {
            console.log('Processing completed checkout');
            
            const session = event.data.object;
            const customerEmail = session.customer_details?.email;
            
            if (!customerEmail) {
                console.error('No customer email found in session:', session);
                return NextResponse.json({ error: 'No customer email found' }, { status: 400 });
            }
            
            console.log('Customer email:', customerEmail);

            // Get line items to determine the package purchased
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
            const priceId = lineItems.data[0]?.price?.id;
            console.log('Price ID from session:', priceId);

            // Get configuration based on price ID
            const config = PRICE_CONFIGS[priceId];
            if (!config) {
                console.error('Unknown price ID:', priceId);
                return NextResponse.json({ error: 'Unknown price ID' }, { status: 400 });
            }

            // Connect to MongoDB
            const client = await clientPromise;
            const db = client.db('ratemyprofessor-db');
            const users = db.collection('users');

            // Generate extension API key if needed
            const extensionApiKey = crypto.randomUUID();
            console.log('Generated API key:', extensionApiKey);

            // Create or update user document
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

            console.log('MongoDB update result:', result);

            // Send confirmation email
            try {
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
                console.log('Confirmation email sent');
            } catch (error) {
                console.error('Email sending error:', error);
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