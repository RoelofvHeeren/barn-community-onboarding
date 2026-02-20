const nodemailer = require('nodemailer');

// Ensure these are in .env
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = 'The Barn Community <no-reply@thebarn.com>'; // Update this

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
    }
});

const emailService = {
    /**
     * Send Welcome Email with Credentials
     */
    async sendWelcomeEmail(email, name, password) {
        try {
            const info = await transporter.sendMail({
                from: FROM_EMAIL,
                to: email,
                subject: 'Welcome to The Barn Community! Your Login Details',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Welcome, ${name}!</h2>
                        <p>We're thrilled to have you join The Barn Community.</p>
                        <p>Your account has been created successfully. You have <strong>7 Days of Silver Access</strong> to explore everything we have to offer.</p>
                        
                        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 0;"><strong>Login URL:</strong> <a href="https://barn-community-f2a4b1.circle.so">https://barn-community-f2a4b1.circle.so</a></p>
                            <p style="margin: 10px 0 0;"><strong>Email:</strong> ${email}</p>
                            <p style="margin: 5px 0 0;"><strong>Temporary Password:</strong> ${password}</p>
                        </div>

                        <p>Please log in and change your password as soon as possible.</p>
                        <p>See you inside,<br>The Barn Team</p>
                    </div>
                `
            });
            console.log(`[Email Service] Welcome email sent to ${email} (Msg ID: ${info.messageId})`);
            return true;
        } catch (error) {
            console.error('[Email Service] Error sending email:', error.message);
            // Don't throw, just log. We don't want to break the webhook flow.
            return false;
        }
    }
};

module.exports = emailService;
