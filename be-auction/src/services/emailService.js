/**
 * Email Service
 * Handles all email sending functionality using nodemailer
 */

import nodemailer from 'nodemailer'
import { getVerificationEmailHTML, getVerificationEmailText } from '../templates/verificationEmail.js'

/**
 * Create nodemailer transporter with SMTP configuration
 * @returns {nodemailer.Transporter}
 */
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  return nodemailer.createTransport(config);
};

/**
 * Send verification email to user
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.userName - User's name
 * @param {string} options.verificationToken - Verification token
 * @returns {Promise<Object>} Email send result
 */
export const sendVerificationEmail = async ({ email, userName, verificationToken }) => {
  try {
    const transporter = createTransporter();

    // Build verification link
    const verificationLink = `${process.env.VERIFICATION_URL_BASE}/api/auth/verify-email?token=${verificationToken}`;

    // Prepare email content
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Auction App'}" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Verify Your Email Address - Auction App',
      text: getVerificationEmailText(userName, verificationLink),
      html: getVerificationEmailHTML(userName, verificationLink),
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Verification email sent:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

/**
 * Verify SMTP connection
 * @returns {Promise<boolean>} Connection status
 */
export const verifyConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    return false;
  }
};

export default {
  sendVerificationEmail,
  verifyConnection,
}
