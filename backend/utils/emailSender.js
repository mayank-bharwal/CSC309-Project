const nodemailer = require('nodemailer');

// Create email transporter
// If SMTP credentials are not configured, emails will fail gracefully
const createTransporter = () => {
  // Check if email is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('⚠️  Email not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send activation email to new user
 * @param {Object} user - User object with name, email, utorid
 * @param {string} resetToken - Reset token for password setup
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendActivationEmail(user, resetToken) {
  const transporter = createTransporter();

  // If email not configured, return failure gracefully
  if (!transporter) {
    return {
      success: false,
      error: 'Email not configured'
    };
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3001';
  const activationUrl = `${appUrl}/set-password/${resetToken}`;
  const fromAddress = process.env.SMTP_FROM || `"UofT Loyalty Program" <${process.env.SMTP_USER}>`;

  const mailOptions = {
    from: fromAddress,
    to: user.email,
    subject: 'Activate Your Loyalty Program Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }
          .link-box { background: #e5e7eb; padding: 12px; border-radius: 6px; word-break: break-all; margin: 15px 0; font-size: 14px; color: #4b5563; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Welcome to the Loyalty Program!</h1>
          </div>

          <div class="content">
            <h2 style="color: #667eea; margin-top: 0;">Hi ${user.name}! 👋</h2>

            <p>Your account has been created by a cashier. To get started, you need to set your password and activate your account.</p>

            <p style="margin: 25px 0;">
              <a href="${activationUrl}" class="button" style="color: white;">Activate My Account</a>
            </p>

            <p><strong>Or copy and paste this link into your browser:</strong></p>
            <div class="link-box">${activationUrl}</div>

            <p><strong>Your UTORid:</strong> ${user.utorid}</p>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #92400e;"><strong>⏰ This link expires in 7 days.</strong></p>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

            <p style="font-size: 14px; color: #6b7280;">
              <strong>Alternative activation method:</strong><br>
              If the link doesn't work, you can visit the <a href="${appUrl}/login" style="color: #667eea;">login page</a> with your UTORid, and you'll be automatically redirected to set your password.
            </p>
          </div>

          <div class="footer">
            <p style="margin: 5px 0;">This is an automated email from the UofT Loyalty Program.</p>
            <p style="margin: 5px 0;">If you didn't request this account, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to the Loyalty Program, ${user.name}!

Your account has been created. Click the link below to set your password and activate your account:

${activationUrl}

Your UTORid: ${user.utorid}

This link expires in 7 days.

Alternative: Visit ${appUrl}/login with your UTORid and you'll be redirected to set your password.

---
This is an automated email from the UofT Loyalty Program.
If you didn't request this account, please ignore this email.
    `.trim(),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Activation email sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendActivationEmail };
