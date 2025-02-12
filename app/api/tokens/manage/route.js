import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req) {
    try {
        const { action, amount } = await req.json();
        const apiKey = req.headers.get('x-api-key');

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API key required' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { db } = await connectToDatabase();
        const user = await db.collection('users').findOne({ apiKey });

        if (!user) {
            return new Response(JSON.stringify({ error: 'Invalid API key' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if user has enough tokens for the operation
        if (action === 'subtract' && user.tokens < amount) {
            return new Response(JSON.stringify({ error: 'Insufficient tokens' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Update tokens
        const updateOperation = action === 'add' ? 
            { $inc: { tokens: amount } } : 
            { $inc: { tokens: -amount } };

        const result = await db.collection('users').findOneAndUpdate(
            { apiKey },
            updateOperation,
            { returnDocument: 'after' }
        );

        return new Response(JSON.stringify({
            tokens: result.value.tokens,
            message: 'Tokens updated successfully'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Token management error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 