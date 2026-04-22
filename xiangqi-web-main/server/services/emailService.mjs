import nodemailer from 'nodemailer';
import { logger } from '../logger.mjs';

let _transporter;

function getTransporter() {
    if (!_transporter) {
        _transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }
    return _transporter;
}

/**
 * Sends an email using the configured SMTP server.
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 */
export async function sendEmail({ to, subject, text, html }) {
    try {
        const transporter = getTransporter();
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to,
            subject,
            text,
            html,
        });
        logger.info(`[EmailService] Email sent to ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error(`[EmailService] Failed to send email to ${to}:`, error.message);
        throw error;
    }
}

export default {
    sendEmail,
};
