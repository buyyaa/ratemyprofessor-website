import { connectToDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
        }

        const { db } = await connectToDatabase();
        const user = await db.collection('users').findOne({ email });

        // Debug log to see what we're getting from the database
        console.log('Found user:', user);

        return NextResponse.json({
            isVerified: user?.verified || false,
            tokens: user?.tokens || 0
        });
    } catch (error) {
        console.error('Error checking email verification:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 