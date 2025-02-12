import nodemailer from 'nodemailer';
import clientPromise from '@/lib/mongodb';

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        //user: "ayyubalhasan@gmail.com",
        //pass: "bkmavuajndmtghch"
    }
});

export async function verifyEmail(email) {
    try {
        const client = await clientPromise;
        const db = client.db('ratemyprofessor-db');
        const user = await db.collection('users').findOne({ email });
        
        return user !== null;
    } catch (error) {
        console.error('Email verification error:', error);
        return false;
    }
}

export async function sendTokenPurchaseEmail(email, tokens) {
    try {
        // First verify the email exists
        const emailExists = await verifyEmail(email);
        if (!emailExists) {
            throw new Error('Email not found in database');
        }

        // Send email using your email service provider's API
        // You can use SendGrid, AWS SES, or other email service here
        // For now, just log the email content
        console.log(`Email would be sent to ${email} for ${tokens} tokens`);
        
    } catch (error) {
        console.error('Email sending error:', error);
        throw error;
    }
} 