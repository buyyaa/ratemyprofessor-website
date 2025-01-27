import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req) {
    try {
        const { db } = await connectToDatabase();
        
        // Create test user
        const testUser = {
            email: "test@example.com",
            tokens: 20, // Starting tokens
            subscriptionStatus: "active",
            extensionApiKey: "test_key_123", // This will be used in the extension
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Check if test user already exists
        const existingUser = await db.collection('users').findOne({ 
            email: testUser.email 
        });

        if (existingUser) {
            return new Response(JSON.stringify({ 
                success: true, 
                user: existingUser,
                message: 'Test user already exists'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Create new test user
        await db.collection('users').insertOne(testUser);
        
        return new Response(JSON.stringify({ 
            success: true, 
            user: testUser,
            message: 'Test user created successfully'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in test endpoint:', error);
        return new Response(JSON.stringify({ 
            error: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 