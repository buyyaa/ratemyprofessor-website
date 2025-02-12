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

        // Check if it's time for token refresh (30 days)
        const now = new Date();
        const lastRefresh = new Date(user.lastTokenRefreshDate);
        const daysSinceRefresh = Math.floor((now - lastRefresh) / (1000 * 60 * 60 * 24));

        if (daysSinceRefresh >= 30 && user.subscriptionTier !== 'pro') {
            // Reset base tokens to 20 but keep purchased tokens
            const purchasedTokens = user.purchasedTokens || 0;
            user.tokens = 20 + purchasedTokens;
            user.lastTokenRefreshDate = now;
            await user.save();
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
            await user.save();
        }

        return NextResponse.json({
            tokensRemaining: user.tokens,
            tokenCost,
            tier: user.subscriptionTier,
            nextRefreshDate: new Date(user.lastTokenRefreshDate.getTime() + (30 * 24 * 60 * 60 * 1000))
        });
    } catch (error) {
        console.error('Token usage error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
} 