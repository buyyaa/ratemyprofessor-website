import { connectToDatabase } from '@/lib/mongodb';


export async function GET(req) {
    const apiKey = req.headers.get('x-api-key');
    
    try {
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
        
        return new Response(JSON.stringify({ 
            tokens: user.tokens,
            subscriptionStatus: user.subscriptionStatus
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function POST(req) {
    const apiKey = req.headers.get('x-api-key');
    const { amount } = await req.json();
    
    try {
        const { db } = await connectToDatabase();
        
        const result = await db.collection('users').updateOne(
            { extensionApiKey: apiKey },
            { 
                $inc: { tokens: amount },
                $set: { updatedAt: new Date() }
            }
        );
        
        if (result.modifiedCount === 0) {
            return new Response(JSON.stringify({ 
                error: 'User not found' 
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const updatedUser = await db.collection('users').findOne({ 
            extensionApiKey: apiKey 
        });
        
        return new Response(JSON.stringify({ 
            tokens: updatedUser.tokens 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 