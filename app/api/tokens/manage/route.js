import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req) {
    try {
        const { action, amount } = await req.json();
        const apiKey = req.headers.get('x-api-key');

        if (!apiKey) {
            return new Response(JSON.stringify({ 
                error: 'API key required' 
            }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { db } = await connectToDatabase();
        
        const user = await db.collection('users').findOne({ 
            extensionApiKey: apiKey 
        });

        if (!user) {
            return new Response(JSON.stringify({ 
                error: 'User not found' 
            }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let newTokens = user.tokens;
        
        switch (action) {
            case 'add':
                newTokens += amount;
                break;
            case 'subtract':
                if (user.tokens < amount) {
                    return new Response(JSON.stringify({ 
                        error: 'Insufficient tokens' 
                    }), { 
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                newTokens -= amount;
                break;
            default:
                return new Response(JSON.stringify({ 
                    error: 'Invalid action' 
                }), { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
        }

        await db.collection('users').updateOne(
            { extensionApiKey: apiKey },
            { 
                $set: { 
                    tokens: newTokens,
                    updatedAt: new Date()
                }
            }
        );

        return new Response(JSON.stringify({ 
            success: true,
            tokens: newTokens 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Token management error:', error);
        return new Response(JSON.stringify({ 
            error: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 