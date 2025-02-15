import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');
        
        if (!token) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/error?message=Invalid verification link`);
        }

        const client = await clientPromise;
        const db = client.db('ratemyprofessor-db');
        const users = db.collection('users');

        const result = await users.findOneAndUpdate(
            { 
                verificationToken: token,
                verified: false 
            },
            { 
                $set: { 
                    verified: true,
                    verificationToken: null,
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );

        if (!result.value) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/error?message=Invalid or expired verification link`);
        }

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/verification-success`);
    } catch (error) {
        console.error('Email verification error:', error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/error?message=Verification failed`);
    }
}

export async function POST(req) {
    try {
        const { email } = await req.json();
        
        const client = await clientPromise;
        const db = client.db('ratemyprofessor-db');
        const users = db.collection('users');

        const user = await users.findOne({ email });

        if (!user) {
            return NextResponse.json({ 
                success: false, 
                error: 'User not found' 
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            verified: user.verified === true,
            extensionApiKey: user.extensionApiKey,
            tokens: user.tokens
        });

    } catch (error) {
        console.error('Verification check error:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Server error' 
        }, { status: 500 });
    }
} 