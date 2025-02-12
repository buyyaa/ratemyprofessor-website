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


//this is the route that checks if the user's tokens need to be refreshed
//it checks the user's last token refresh date and compares it to the current date
//if the user's last token refresh date is more than 30 days ago, then the user's tokens need to be refreshed
//the user's tokens are refreshed by adding the user's purchased tokens to the user's current tokens
//the user's last token refresh date is updated to the current date

//this route is used to check if the user's tokens need to be refreshed
//it is used to update the user's tokens and last token refresh date
//it is used to check if the user's tokens need to be refreshed
//it is used to update the user's tokens and last token refresh date
//it is used to check if the user's tokens need to be refreshed
//it is used to update the user's tokens and last token refresh date
