import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER);

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
        console.log('Received registration request for email:', email);

        const client = await clientPromise;
        const db = client.db('ratemyprofessor-db');
        const users = db.collection('users');

        // Check if user exists
        const existingUser = await users.findOne({ email });

        if (existingUser) {
            if (!existingUser.verified) {
                // Resend verification email
                const verificationToken = crypto.randomUUID();
                await users.updateOne(
                    { email },
                    { 
                        $set: { 
                            verificationToken,
                            updatedAt: new Date()
                        }
                    }
                );
                
                // Send verification email
                await sendVerificationEmail(email, verificationToken);
                
                return NextResponse.json({
                    success: true,
                    message: 'Verification email resent'
                });
            }
            return NextResponse.json({
                success: true,
                message: 'Email already verified'
            });
        }

        // Create new user
        const verificationToken = crypto.randomUUID();
        const extensionApiKey = crypto.randomUUID();
        
        await users.insertOne({
            email,
            extensionApiKey,
            verificationToken,
            verified: false,
            tokens: 20, // Free tier starts with 20 tokens
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Send verification email
        await sendVerificationEmail(email, verificationToken);

        return NextResponse.json({
            success: true,
            message: 'Registration successful. Please check your email for verification.'
        });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Server error' 
        }, { status: 500 });
    }
}

async function sendVerificationEmail(email, token) {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Verify Your Email - Professor Rater Pro',
            html: `
                <h2>Welcome to Professor Rater Pro!</h2>
                <p>Please verify your email address by clicking the button below:</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/verify-email?token=${token}" 
                   style="display: inline-block; background-color: #4CAF50; color: white; padding: 14px 25px; 
                   text-align: center; text-decoration: none; font-size: 16px; margin: 4px 2px; 
                   border-radius: 4px;">
                    Verify Email
                </a>
                <p>If the button doesn't work, you can copy and paste this link in your browser:</p>
                <p>${process.env.NEXT_PUBLIC_APP_URL}/api/verify-email?token=${token}</p>
                <br>
                <p>Best regards,</p>
                <p>The Professor Rater Pro Team</p>
            `
        });
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
} 