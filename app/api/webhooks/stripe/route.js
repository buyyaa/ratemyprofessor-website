import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import clientPromise from '@/lib/mongodb';
import { sendTokenPurchaseEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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
            const client = await clientPromise;
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
                // Send confirmation email
                await sendTokenPurchaseEmail(customerEmail, 30);
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

export const config = {
    api: {
        bodyParser: false,
    },
}; 