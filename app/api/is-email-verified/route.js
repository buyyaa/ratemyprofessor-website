import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ 
            isVerified: false, 
            error: 'Email parameter is required' 
        });
    }

    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const database = client.db('ratemyprofessor-db');
        const users = database.collection('users');

        // Update the query to look for the email in the correct field
        const user = await users.findOne({ 
            email: email.toLowerCase(),
        });

        console.log('Found user:', user);

        if (!user) {
            return NextResponse.json({ 
                isVerified: false, 
                error: 'User not found' 
            });
        }

        return NextResponse.json({
            isVerified: user.verified === true,
            tokens: user.tokens || 0
        });

    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ 
            isVerified: false, 
            error: 'Internal server error' 
        }, { status: 500 });
    } finally {
        await client.close();
    }
} 