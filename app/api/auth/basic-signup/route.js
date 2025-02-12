import { connectToDatabase } from '@/lib/mongodb';
import crypto from 'crypto';

export async function POST(req) {
    try {
        const { email } = await req.json();

        if (!email) {
            return new Response(JSON.stringify({ 
                error: 'Email is required' 
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { db } = await connectToDatabase();

        // Check if user already exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return new Response(JSON.stringify({ 
                error: 'Email already registered' 
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Generate API key
        const apiKey = crypto.randomBytes(32).toString('hex');

        // Create new user
        const user = {
            email,
            apiKey,
            tokens: 20, // Starting tokens for Basic plan
            plan: 'Basic',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await db.collection('users').insertOne(user);

        return new Response(JSON.stringify({ 
            success: true,
            apiKey,
            message: 'Successfully signed up for Basic plan'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Basic signup error:', error);
        return new Response(JSON.stringify({ 
            error: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 