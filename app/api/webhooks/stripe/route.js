import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import nodemailer from 'nodemailer';
import clientPromise from '@/lib/mongodb';

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
        // Get MongoDB client
        const client = await clientPromise;
        const db = client.db('ratemyprofessor-db');
        
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');

        let event;
        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                webhookSecret
            );
        } catch (err) {
            return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const customerEmail = session.customer_email;
            const priceId = session.line_items?.data[0]?.price?.id;
            
            // Get product configuration based on price ID
            const productConfig = PRODUCT_CONFIGS[priceId];
            
            if (!productConfig) {
                console.error('Unknown product:', priceId);
                return NextResponse.json({ error: 'Unknown product' }, { status: 400 });
            }

            // Prepare update based on product type
            const updateOperation = {
                $set: {
                    updatedAt: new Date(),
                    lastPurchase: {
                        date: new Date(),
                        productName: productConfig.name,
                        stripeSessionId: session.id
                    }
                }
            };

            // Add tokens update if applicable
            if (productConfig.tokens > 0) {
                updateOperation.$inc = { tokens: productConfig.tokens };
            }

            // Update subscription status for pro tier
            if (productConfig.tier === 'pro') {
                updateOperation.$set.subscriptionStatus = 'pro';
                updateOperation.$set.tokens = -1; // Unlimited tokens
            }

            // Update or create user
            const users = db.collection('users');
            const result = await users.findOneAndUpdate(
                { email: customerEmail },
                updateOperation,
                { 
                    upsert: true,
                    returnDocument: 'after'
                }
            );

            if (result.value) {
                // Send confirmation email
                await sendEmail(customerEmail, productConfig);
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