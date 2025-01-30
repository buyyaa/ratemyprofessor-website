import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import nodemailer from 'nodemailer';
import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';

// Remove edge runtime since we're using Node.js features
// export const runtime = 'edge';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Email configuration using existing settings
const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER);

// Define product IDs and their corresponding tokens/tiers
const PRODUCT_CONFIGS = {
    'test_bIY9ElbsH9Kl3dufYY': { tokens: 30, tier: 'basic', name: '30 Tokens' },
    'test_00gg2JfIXe0B5lC8wx': { tokens: 90, tier: 'basic', name: '90 Tokens' },
    'test_aEU5o5aoD8GhaFWaEG': { tokens: -1, tier: 'pro', name: 'Unlimited Pro' } // -1 indicates unlimited
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
            const customerEmail = session.customer_email;
            console.log('Customer email:', customerEmail);

            // Connect to MongoDB
            const client = await clientPromise;
            const db = client.db('ratemyprofessor-db');
            const users = db.collection('users');

            // Generate extension API key
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
                    subscriptionStatus: 'basic',
                    tokens: 30,
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
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM,
                    to: customerEmail,
                    subject: 'Token Purchase Confirmation',
                    html: `
                        <h2>Thank you for your purchase!</h2>
                        <p>Your account has been credited with 30 tokens.</p>
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