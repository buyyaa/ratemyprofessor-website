import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req) {
    try {
        const { text } = await req.json();
        const apiKey = req.headers.get('x-api-key');

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API key required' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verify user and check tokens
        const { db } = await connectToDatabase();
        const user = await db.collection('users').findOne({ apiKey });

        if (!user) {
            return new Response(JSON.stringify({ error: 'Invalid API key' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (user.tokens < 2) {
            return new Response(JSON.stringify({ error: 'Insufficient tokens' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Make request to Gemini API
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text }] }]
            })
        });

        const data = await response.json();

        // Deduct tokens
        await db.collection('users').updateOne(
            { apiKey },
            { $inc: { tokens: -2 } }
        );

        return new Response(JSON.stringify({
            result: data,
            tokens: user.tokens - 2
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Gemini API error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 