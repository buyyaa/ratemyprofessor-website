import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

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
        const { email, action, amount } = await req.json();
        const apiKey = req.headers.get('x-api-key');
        
        const client = await clientPromise;
        const db = client.db('ratemyprofessor-db');
        const users = db.collection('users');

        switch (action) {
            case 'register': {
                // Generate a unique API key for the extension
                const extensionApiKey = crypto.randomUUID();
                
                const result = await users.findOneAndUpdate(
                    { email },
                    { 
                        $setOnInsert: { 
                            email,
                            extensionApiKey,
                            tokens: 20,
                            subscriptionStatus: 'basic',
                            createdAt: new Date()
                        },
                        $set: { 
                            updatedAt: new Date() 
                        }
                    },
                    { 
                        upsert: true,
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