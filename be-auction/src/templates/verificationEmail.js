/**
 * Email Verification Template
 * Generates HTML email for user email verification
 */

/**
 * Generate verification email HTML
 * @param {string} userName - User's name
 * @param {string} verificationLink - Full verification URL
 * @returns {string} HTML email content
 */
export const getVerificationEmailHTML = (userName, verificationLink) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
            color: #333333;
            line-height: 1.6;
        }
        .content h2 {
            color: #667eea;
            margin-top: 0;
            font-size: 24px;
        }
        .content p {
            margin: 15px 0;
            font-size: 16px;
        }
        .button-container {
            text-align: center;
            margin: 35px 0;
        }
        .verify-button {
            display: inline-block;
            padding: 15px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s;
        }
        .verify-button:hover {
            transform: translateY(-2px);
        }
        .alternative-link {
            margin-top: 25px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 5px;
            word-break: break-all;
        }
        .alternative-link p {
            margin: 5px 0;
            font-size: 14px;
            color: #666666;
        }
        .alternative-link a {
            color: #667eea;
            text-decoration: none;
        }
        .footer {
            padding: 30px;
            text-align: center;
            background-color: #f8f9fa;
            color: #666666;
            font-size: 14px;
        }
        .footer p {
            margin: 5px 0;
        }
        .warning {
            margin-top: 20px;
            padding: 15px;
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            border-radius: 4px;
        }
        .warning p {
            margin: 0;
            color: #856404;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 Auction App</h1>
        </div>
        
        <div class="content">
            <h2>Welcome, ${userName}! 👋</h2>
            
            <p>Thank you for registering with Auction App. We're excited to have you on board!</p>
            
            <p>To complete your registration and start exploring our platform, please verify your email address by clicking the button below:</p>
            
            <div class="button-container">
                <a href="${verificationLink}" class="verify-button">Verify Email Address</a>
            </div>
            
            <div class="alternative-link">
                <p><strong>Or copy and paste this link into your browser:</strong></p>
                <p><a href="${verificationLink}">${verificationLink}</a></p>
            </div>
            
            <div class="warning">
                <p><strong>⏰ This link will expire in 24 hours.</strong> If you don't verify your email within this time, you'll need to request a new verification link.</p>
            </div>
            
            <p style="margin-top: 30px;">If you didn't create an account with us, please ignore this email or contact our support team if you have concerns.</p>
        </div>
        
        <div class="footer">
            <p><strong>Auction App</strong></p>
            <p>Your trusted platform for art auctions</p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">
                This is an automated email. Please do not reply to this message.
            </p>
        </div>
    </div>
</body>
</html>
  `.trim();
};

/**
 * Generate verification email plain text version
 * @param {string} userName - User's name
 * @param {string} verificationLink - Full verification URL
 * @returns {string} Plain text email content
 */
export const getVerificationEmailText = (userName, verificationLink) => {
  return `
Welcome to Auction App, ${userName}!

Thank you for registering with us. We're excited to have you on board!

To complete your registration and start exploring our platform, please verify your email address by visiting the link below:

${verificationLink}

This link will expire in 24 hours. If you don't verify your email within this time, you'll need to request a new verification link.

If you didn't create an account with us, please ignore this email.

---
Auction App
Your trusted platform for art auctions

This is an automated email. Please do not reply to this message.
  `.trim();
};

export default {
    getVerificationEmailHTML,
    getVerificationEmailText,
};
