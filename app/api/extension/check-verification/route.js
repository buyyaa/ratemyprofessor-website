import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(req) {
    try {
        const { email } = await req.json();
        
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('ratemyprofessor-db');
        const users = db.collection('users');

        const user = await users.findOne({ email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            verified: user.verified === true,
            email: user.email
        });

    } catch (error) {
        console.error('Check verification error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
} 