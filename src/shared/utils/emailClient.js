const nodemailer = require('nodemailer');
const logger = require('./logger');
const settingsRepository = require('../../modules/settings/repository');

class EmailClient {
  async _getConfig() {
    const configRow = await settingsRepository.getSetting('smtp_config');
    const cfg = configRow?.value || {};

    const host = cfg.host || process.env.SMTP_HOST;
    const port = parseInt(cfg.port || process.env.SMTP_PORT || '587');
    const secure = port === 465 || process.env.SMTP_SECURE === 'true';
    const user = cfg.user || process.env.SMTP_USER;
    const pass = cfg.pass || process.env.SMTP_PASS;
    const fromName = cfg.from_name || 'Nalas Catering';
    const fromEmail = user || 'noreply@nalas.com';

    return {
      transporter: nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      }),
      from: `"${fromName}" <${fromEmail}>`,
      host
    };
  }

  /**
   * Send a password reset email
   * @param {string} to - Recipient email
   * @param {string} token - Reset token
   */
  async sendPasswordReset(to, token) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    
    const config = await this._getConfig();

    const mailOptions = {
      from: config.from,
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
      if (process.env.NODE_ENV === 'development' && !config.host) {
        logger.info('--- DEV MODE: Password Reset Link ---');
        logger.info(`To: ${to}`);
        logger.info(`Link: ${resetUrl}`);
        return;
      }

      await config.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to ${to}`);
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      throw new Error('Email service unavailable');
    }
  }
}

module.exports = new EmailClient();

