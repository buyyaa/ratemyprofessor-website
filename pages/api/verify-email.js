import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid'; // Make sure to install uuid package

const uri = process.env.MONGODB_URI;
const options = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
};

export default async function handler(req, res) {
    console.log('API Request received:', {
        method: req.method,
        body: req.body,
        headers: req.headers
    });

    if (req.method !== 'POST') {
        console.error('Invalid method:', req.method);
        return res.status(405).json({ 
            success: false, 
            message: 'Method not allowed' 
        });
    }

    let client;
    try {
        const { email, action } = req.body;
        
        console.log('Processing request:', { email, action });

        if (!email) {
            console.error('No email provided in request');
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        if (action !== 'register') {
            console.error('Invalid action:', action);
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid action' 
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.error('Invalid email format:', email);
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email format' 
            });
        }

        // Connect to MongoDB
        client = await MongoClient.connect(uri, options);
        const db = client.db('ratemyprofessor-db');
        const collection = db.collection('users');

        // Check if user already exists
        const existingUser = await collection.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Generate extension API key
        const extensionApiKey = uuidv4();

        // Create new free tier user
        const result = await collection.insertOne({
            email,
            extensionApiKey,    // Add API key for verification
            tokens: 20,         // Free tier starts with 20 tokens
            createdAt: new Date(),
            lastUpdated: new Date()
        });

        console.log('Registration successful for:', email);
        
        return res.status(200).json({
            success: true,
            message: 'Registration successful',
            tokens: 20,
            email: email,
            extensionApiKey    // Return the API key to the client
        });

    } catch (error) {
        console.error('Server error:', {
            message: error.message,
            stack: error.stack
        });
        
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message 
        });
    } finally {
        if (client) {
            await client.close();
        }
    }
} 