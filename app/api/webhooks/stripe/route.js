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

// Webhook handler

//send tyest


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
                // Get customer details directly from the session
                const customerDetails = session.customer_details;
                const customerEmail = customerDetails?.email;
                const customerName = customerDetails?.name || 'Customer';

                if (!customerEmail) {
                    throw new Error('No customer email found in session');
                }
                
                console.log('Processing purchase for:', customerName, customerEmail);

                // Get payment intent to get price information
                const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
                const amount = paymentIntent.amount;

                // Determine package based on amount
                let config;
                if (amount === 99) {
                    config = PRICE_CONFIGS['price_1QmUNjRx1RbwTEuJ585357jc']; // 30 tokens
                } else if (amount === 199) {
                    config = PRICE_CONFIGS['price_1Qmkm1Rx1RbwTEuJMWHZO0iS']; // 90 tokens
                } else if (amount === 1000) {
                    config = PRICE_CONFIGS['price_1Qmkn9Rx1RbwTEuJJi5mDzKo']; // Unlimited
                } else {
                    throw new Error(`Unknown payment amount: ${amount}`);
                }

                // Connect to MongoDB
                const client = await clientPromise;
                const db = client.db('ratemyprofessor-db');
                const users = db.collection('users');

                // Check if user exists
                const existingUser = await users.findOne({ email: customerEmail });
                
                if (existingUser) {
                    console.log('Existing user found:', existingUser.email);
                    
                    // Handle unlimited pro upgrade
                    if (config.tokens === -1) {
                        // Update to pro status
                        await users.updateOne(
                            { email: customerEmail },
                            {
                                $set: {
                                    subscriptionStatus: 'pro',
                                    tokens: -1,
                                    updatedAt: new Date()
                                }
                            }
                        );
                    } else {
                        // Add tokens to existing amount and update purchasedTokens
                        if (existingUser.tokens !== -1) {
                            await users.updateOne(
                                { email: customerEmail },
                                {
                                    $inc: { 
                                        tokens: config.tokens,
                                        purchasedTokens: config.tokens 
                                    },
                                    $set: { updatedAt: new Date() }
                                }
                            );
                        }
                    }
                    
                    console.log('Updated existing user account');
                } else {
                    console.log('Creating new user account');
                    // Create new user with both free and purchased tokens
                    const extensionApiKey = crypto.randomUUID();
                    await users.insertOne({
                        email: customerEmail,
                        name: customerName,
                        extensionApiKey,
                        subscriptionStatus: config.tier,
                        tokens: 20 + config.tokens, // Free tokens + purchased tokens
                        purchasedTokens: config.tokens, // Track purchased tokens separately
                        lastTokenRefreshDate: new Date(),
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }

                // Get updated user data for email
                const updatedUser = await users.findOne({ email: customerEmail });
                console.log('Final user state:', updatedUser);

                // Send confirmation email
                const tokenText = config.tokens === -1 ? 
                    'unlimited tokens' : 
                    `${config.tokens} tokens (Total balance: ${updatedUser.tokens})`;

                await transporter.sendMail({
                    from: process.env.EMAIL_FROM,
                    to: customerEmail,
                    subject: `Purchase Confirmation - ${config.name}`,
                    html: `
                        <h2>Thank you for your purchase, ${customerName}!</h2>
                        <p>Your account has been credited with ${tokenText}.</p>
                        <p>Your extension API key: ${updatedUser.extensionApiKey}</p>
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