import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('ratemyprofessor-db');
        const user = await db.collection('users').findOne({ email });
        
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const now = new Date();
        const lastRefresh = new Date(user.lastTokenRefreshDate || user.createdAt);
        const daysSinceRefresh = Math.floor((now - lastRefresh) / (1000 * 60 * 60 * 24));
        const daysUntilRefresh = 30 - daysSinceRefresh;

        return NextResponse.json({
            currentTokens: user.tokens,
            purchasedTokens: user.purchasedTokens || 0,
            lastRefreshDate: lastRefresh,
            daysSinceLastRefresh: daysSinceRefresh,
            daysUntilNextRefresh: daysUntilRefresh,
            willRefreshToday: daysSinceRefresh >= 30,
            nextRefreshAmount: 20 + (user.purchasedTokens || 0)
        });
    } catch (error) {
        console.error('Check refresh error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
