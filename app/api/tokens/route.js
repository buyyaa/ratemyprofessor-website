import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        //user: "ayyubalhasan@gmail.com",
        //pass: "bkmavuajndmtghch"
    }
});

async function sendTokenPurchaseEmail(email, tokens) {
    try {
        await transporter.sendMail({
            from: 'noreply@ratemyprofessor-website.vercel.app',
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

export async function GET(req) {
    const apiKey = req.headers.get('x-api-key');
    
    try {
        const client = await clientPromise;
        const db = client.db('ratemyprofessor-db');
        
        const user = await db.collection('users').findOne({ 
            extensionApiKey: apiKey 
        });
        
        if (!user) {
            return NextResponse.json({ 
                error: 'User not found' 
            }, { status: 404 });
        }
        
        return NextResponse.json({ 
            tokens: user.tokens,
            subscriptionStatus: user.subscriptionStatus
        }, { status: 200 });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ 
            error: error.message 
        }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { email, action, amount, stripeSessionId } = await req.json();
        const apiKey = req.headers.get('x-api-key');
        
        const client = await clientPromise;
        const db = client.db('ratemyprofessor-db');
        const users = db.collection('users');

        switch (action) {
            case 'verify': {
                // Check if email exists in database
                const user = await users.findOne({ email });
                if (!user) {
                    return NextResponse.json({
                        success: false,
                        error: 'Email not found. Please purchase tokens first.'
                    }, { status: 404 });
                }
                
                return NextResponse.json({
                    success: true,
                    tokens: user.tokens,
                    extensionApiKey: user.extensionApiKey || crypto.randomUUID()
                });
            }

            case 'register': {
                // Check if user exists first
                const existingUser = await users.findOne({ email });
                
                if (!existingUser) {
                    return NextResponse.json({
                        success: false,
                        error: 'User not found. Please purchase tokens first.'
                    }, { status: 404 });
                }
                
                // If user exists but doesn't have an extension API key, generate one
                const extensionApiKey = existingUser.extensionApiKey || crypto.randomUUID();
                
                const result = await users.findOneAndUpdate(
                    { email },
                    { 
                        $set: { 
                            extensionApiKey,
                            updatedAt: new Date() 
                        }
                    },
                    { 
                        returnDocument: 'after'
                    }
                );
                
                return NextResponse.json({
                    success: true,
                    extensionApiKey: result.value.extensionApiKey,
                    tokens: result.value.tokens
                });
            }

            case 'update': {
                const result = await users.findOneAndUpdate(
                    { extensionApiKey: apiKey },
                    { 
                        $inc: { tokens: amount },
                        $set: { updatedAt: new Date() }
                    },
                    { returnDocument: 'after' }
                );

                if (!result.value) {
                    return NextResponse.json({ 
                        error: 'User not found' 
                    }, { status: 404 });
                }

                return NextResponse.json({ 
                    tokens: result.value.tokens 
                });
            }

            case 'purchase': {
                // Handle token purchase
                const result = await users.findOneAndUpdate(
                    { email },
                    { 
                        $inc: { tokens: 30 }, // Add 30 tokens
                        $set: { 
                            updatedAt: new Date(),
                            lastPurchase: {
                                date: new Date(),
                                amount: 30,
                                stripeSessionId
                            }
                        }
                    },
                    { returnDocument: 'after' }
                );

                if (!result.value) {
                    return NextResponse.json({ 
                        error: 'User not found' 
                    }, { status: 404 });
                }

                // Send confirmation email
                await sendTokenPurchaseEmail(email, 30);

                return NextResponse.json({
                    success: true,
                    tokens: result.value.tokens
                });
            }

            default:
                return NextResponse.json({ 
                    error: 'Invalid action' 
                }, { status: 400 });
        }
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ 
            error: error.message 
        }, { status: 500 });
    }
} 