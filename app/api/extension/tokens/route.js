import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';
import User from '@/models/User';

const SCAN_COST = 2;  // Tokens per scan
const AI_SCAN_COST = 2;  // Tokens per AI scan

export async function POST(req) {
    try {
        await connectMongo();
        
        const { apiKey, action } = await req.json();
        
        const user = await User.findOne({ extensionApiKey: apiKey });
        if (!user) {
            return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
        }

        // Check if it's time for monthly token refill
        const now = new Date();
        const lastRefill = new Date(user.lastTokenRefillDate);
        if (now.getMonth() !== lastRefill.getMonth() || now.getFullYear() !== lastRefill.getFullYear()) {
            // Refill tokens based on subscription tier
            switch (user.subscriptionTier) {
                case 'pro':
                    user.tokens = Infinity;  // Unlimited tokens
                    break;
                case 'premium':
                    user.tokens = 100;  // 100 tokens per month
                    break;
                default:
                    user.tokens = 20;  // 20 tokens per month for free tier
            }
            user.lastTokenRefillDate = now;
        }

        // Calculate token cost
        const tokenCost = action === 'ai_scan' ? AI_SCAN_COST : SCAN_COST;

        // Check if user has enough tokens
        if (user.tokens < tokenCost && user.subscriptionTier !== 'pro') {
            return NextResponse.json({ 
                error: 'Insufficient tokens',
                tokensNeeded: tokenCost,
                tokensRemaining: user.tokens,
                upgradeUrl: process.env.NEXT_PUBLIC_WEBSITE_URL + '/pricing'
            }, { status: 403 });
        }

        // Deduct tokens if not pro tier
        if (user.subscriptionTier !== 'pro') {
            user.tokens -= tokenCost;
            user.totalTokensUsed += tokenCost;
        }

        await user.save();

        return NextResponse.json({
            tokensRemaining: user.tokens,
            tokenCost,
            tier: user.subscriptionTier
        });
    } catch (error) {
        console.error('Token usage error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
} 