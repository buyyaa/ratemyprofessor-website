import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: "ayyubalhasan@gmail.com",
        pass: "bkmavuajndmtghch"
    }
});

export async function sendTokenPurchaseEmail(email, tokens) {
    try {
        await transporter.sendMail({
            from: 'noreply@ratemyprofessor-website.vercel.app',
            to: email,
            subject: 'Token Purchase Confirmation',
            html: `
                <h2>Thank you for your purchase!</h2>
                <p>Your account has been credited with ${tokens} additional tokens.</p>
                <p>You can now use these tokens in the Professor Rater Pro extension.</p>
                <br>
                <p>Best regards,</p>
                <p>The Professor Rater Pro Team</p>
            `
        });
    } catch (error) {
        console.error('Email sending error:', error);
    }
} 