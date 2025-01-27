import EmailProvider from 'next-auth/providers/email';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import config from '@/config';
import connectMongo from './mongo';

export const authOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        EmailProvider({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM,
            maxAge: 24 * 60 * 60, // How long email links are valid for (default 24h)
        }),
    ],
    
    adapter: MongoDBAdapter(connectMongo),
    
    callbacks: {
        session: async ({ session, user }) => {
            if (session?.user) {
                session.user.id = user.id;
                session.user.tokens = user.tokens;
                session.user.subscriptionTier = user.subscriptionTier;
                session.user.extensionApiKey = user.extensionApiKey;
            }
            return session;
        }
    },
    
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
        verifyRequest: '/auth/verify-request',
    },
    
    session: {
        strategy: 'database',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60, // 24 hours
    },
    
    theme: {
        colorScheme: 'light',
        brandColor: config.colors.main,
        logo: '/logo.png', // Add your logo path here
    }
};
