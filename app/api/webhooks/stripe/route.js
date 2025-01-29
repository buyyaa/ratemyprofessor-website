import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { Stripe } from 'stripe';
import nodemailer from 'nodemailer';

// Remove edge runtime since we're using Node.js features
// export const runtime = 'edge';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Email configuration using existing settings
const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER);

async function sendEmail(email, tokens) {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Token Purchase Confirmation',
            html: `
                <h2>Thank you for your purchase!</h2>
                <p>Your account has been credited with ${tokens} additional tokens.</p>
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

            // Connect to MongoDB
            const client = await MongoClient.connect(process.env.MONGODB_URI);
            const db = client.db('ratemyprofessor-db');
            const users = db.collection('users');

            // Update user's tokens
            const result = await users.findOneAndUpdate(
                { email: customerEmail },
                {
                    $inc: { tokens: 30 },
                    $set: {
                        updatedAt: new Date(),
                        lastPurchase: {
                            date: new Date(),
                            amount: 30,
                            stripeSessionId: session.id
                        }
                    }
                },
                { returnDocument: 'after' }
            );

            if (result.value) {
                // Send confirmation email using existing email configuration
                await sendEmail(customerEmail, 30);
            }

            await client.close();
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