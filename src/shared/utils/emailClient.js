const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailClient {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Send a password reset email
   * @param {string} to - Recipient email
   * @param {string} token - Reset token
   */
  async sendPasswordReset(to, token) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: `"Nalas Catering" <${process.env.SMTP_FROM || 'noreply@nalas.com'}>`,
      to,
      subject: 'Password Reset Request — Nalas',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #333;">Nalas Catering Management</h2>
          <p>You requested a password reset for your Nalas account.</p>
          <p>Please click the button below to reset your password. This link is valid for 1 hour.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 14px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    try {
      if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
        logger.info('--- DEV MODE: Password Reset Link ---');
        logger.info(`To: ${to}`);
        logger.info(`Link: ${resetUrl}`);
        return;
      }

      await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to ${to}`);
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      throw new Error('Email service unavailable');
    }
  }
}

module.exports = new EmailClient();
