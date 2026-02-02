import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private emailEnabled: boolean;

  constructor(private configService: ConfigService) {
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    // Check if SMTP is properly configured
    this.emailEnabled = !!(smtpUser && smtpPass);

    if (this.emailEnabled) {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
        port: this.configService.get<number>('SMTP_PORT') || 587,
        secure: false,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log('Email service initialized successfully');
    } else {
      this.logger.warn(
        'Email service disabled: SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in .env file',
      );
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    if (!this.emailEnabled) {
      this.logger.warn(
        `Email not sent to ${email} - SMTP not configured. Verification token: ${token}`,
      );
      this.logger.warn(
        `Manual verification URL: ${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/verify-email?token=${token}`,
      );
      return;
    }

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const mailOptions = {
      from: `"Hyperflix" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: 'Verify Your Email - Hyperflix',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to Hyperflix!</h1>
              </div>
              <div class="content">
                <h2>Verify Your Email Address</h2>
                <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
                <a href="${verificationUrl}" class="button">Verify Email</a>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
                <p><strong>This link will expire in 24 hours.</strong></p>
                <p>If you didn't create an account with Hyperflix, please ignore this email.</p>
              </div>
              <div class="footer">
                <p>&copy; 2026 Hyperflix. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}:`,
        error.message,
      );
      this.logger.warn(`Manual verification URL: ${verificationUrl}`);
      throw new Error(
        'Failed to send verification email. Please contact support.',
      );
    }
  }






async sendEmailUpdateVerification(email: string, token: string): Promise<void> {
  if (!this.emailEnabled) {
    this.logger.warn(
      `Email update confirmation not sent to ${email} - SMTP not configured. Token: ${token}`,
    );
    this.logger.warn(
      `Manual confirmation URL: ${
        this.configService.get<string>('BACKEND_URL') || 'http://localhost:3001'
      }/confirm-email-update?token=${token}`,
    );
    return;
  }

  const backendUrl =
    this.configService.get<string>('BACKEND_URL') || 'http://localhost:3001';

  const confirmationUrl = `${backendUrl}/settings/confirm-email-update?token=${token}`;

  const mailOptions = {
    from: `"Hyperflix" <${this.configService.get<string>('SMTP_USER')}>`,
    to: email,
    subject: 'Confirm Your New Email Address - Hyperflix',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Change Request</h1>
            </div>
            <div class="content">
              <h2>Confirm Your New Email Address</h2>
              <p>
                You requested to update the email address associated with your Hyperflix account.
                Please confirm this change by clicking the button below:
              </p>

              <a href="${confirmationUrl}" class="button">
                Confirm Email Update
              </a>

              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">
                ${confirmationUrl}
              </p>

              <p><strong>This link will expire in 24 hours.</strong></p>

              <p>
                If you did not request this change, please ignore this email.
                Your account will remain secure.
              </p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Hyperflix. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await this.transporter.sendMail(mailOptions);
    this.logger.log(`Email update confirmation sent successfully to ${email}`);
  } catch (error) {
    this.logger.error(
      `Failed to send email update confirmation to ${email}:`,
      error.message,
    );
    this.logger.warn(`Manual confirmation URL: ${confirmationUrl}`);
    throw new Error(
      'Failed to send email update confirmation. Please contact support.',
    );
  }
}


}
