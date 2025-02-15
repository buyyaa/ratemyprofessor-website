import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import nodemailer from 'nodemailer';
import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';

// Remove edge runtime since we're using Node.js features
// export const runtime = 'edge';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Email configuration
const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER);

// Define Stripe price IDs and their corresponding configurations
const PRICE_CONFIGS = {
    'price_1QlZxfRx1RbwTEuJHYZ3aF71': { 
        tokens: 30, 
        tier: 'basic', 
        price: 99,
        name: '30 Tokens Package'
    },
    'price_1QlZybRx1RbwTEuJTo32RGaA': { 
        tokens: 90, 
        tier: 'basic', 
        price: 199,
        name: '90 Tokens Package'
    },
    'price_1QnW04Rx1RbwTEuJiRQ4ByZZ': { 
        tokens: -1, 
        tier: 'pro', 
        price: 799,
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
        console.log('Webhook received:', new Date().toISOString());
        
        const signature = req.headers.get('stripe-signature');
        
        let event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
            console.log('Event type:', event.type);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return new Response(`Webhook Error: ${err.message}`, { status: 400 });
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

                // Get line items to determine the price ID directly
                const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
                const priceId = lineItems.data[0].price.id;
                
                // Get configuration based on price ID
                const config = PRICE_CONFIGS[priceId];

                if (!config) {
                    throw new Error(`Unknown price ID: ${priceId}`);
                }

                console.log('Selected config:', config);

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
                    const extensionApiKey = crypto.randomUUID();
                    const verificationToken = crypto.randomUUID();
                    await users.insertOne({
                        email: customerEmail,
                        name: customerName,
                        extensionApiKey,
                        subscriptionStatus: config.tier,
                        tokens: 20 + config.tokens,
                        purchasedTokens: config.tokens,
                        verified: false,
                        verificationToken,
                        lastTokenRefreshDate: new Date(),
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });

                    // Send verification email
                    await transporter.sendMail({
                        from: process.env.EMAIL_FROM,
                        to: customerEmail,
                        subject: 'Verify Your Email - Professor Rater Pro',
                        html: `
                            <h2>Welcome to Professor Rater Pro, ${customerName}!</h2>
                            <p>Please verify your email address by clicking the button below:</p>
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/verify-email?token=${verificationToken}" 
                               style="display: inline-block; background-color: #4CAF50; color: white; padding: 14px 25px; 
                               text-align: center; text-decoration: none; font-size: 16px; margin: 4px 2px; 
                               border-radius: 4px;">
                                Verify Email
                            </a>
                            <p>If the button doesn't work, you can copy and paste this link in your browser:</p>
                            <p>${process.env.NEXT_PUBLIC_APP_URL}/api/verify-email?token=${verificationToken}</p>
                            <br>
                            <p>Best regards,</p>
                            <p>The Professor Rater Pro Team</p>
                        `
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