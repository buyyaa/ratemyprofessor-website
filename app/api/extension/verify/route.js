import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';
import User from '@/models/User';
import ExtensionUsage from '@/models/ExtensionUsage';

export async function POST(req) {
    try {
        await connectMongo();
        
        const { apiKey } = await req.json();
        
        const user = await User.findOne({ extensionApiKey: apiKey });
        if (!user) {
            return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
        }

        // Get or create usage tracking
        let usage = await ExtensionUsage.findOne({ userId: user._id });
        if (!usage) {
            usage = new ExtensionUsage({
                userId: user._id,
                monthlyReset: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
            });
        }

        // Check monthly reset
        await usage.resetIfNewMonth();

        // Check scan limits based on tier
        const canScan = user.subscriptionTier === 'premium' || 
                       user.subscriptionTier === 'pro' || 
                       usage.scansThisMonth < 30;

        if (!canScan) {
            return NextResponse.json({ 
                error: 'Monthly scan limit reached',
                upgradeUrl: process.env.NEXT_PUBLIC_WEBSITE_URL + '/pricing'
            }, { status: 403 });
        }

        // Increment scan count for free tier
        if (user.subscriptionTier === 'free') {
            usage.scansThisMonth += 1;
            usage.lastScanDate = new Date();
            await usage.save();
        }

        return NextResponse.json({
            tier: user.subscriptionTier,
            scansRemaining: user.subscriptionTier === 'free' ? 30 - usage.scansThisMonth : null
        });
    } catch (error) {
        console.error('Extension verification error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
} 