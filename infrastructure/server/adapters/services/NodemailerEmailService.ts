import nodemailer, { Transporter } from 'nodemailer';
import { EmailService } from '@lehman-brothers/application';

export class NodemailerEmailService implements EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendConfirmationEmail(email: string, token: string): Promise<void> {
    const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/confirm-email?token=${token}`;
    
    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@lehmanbrothers.com',
      to: email,
      subject: 'Confirm your Lehman Brothers account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a365d;">Welcome to Lehman Brothers!</h1>
          <p>Thank you for registering with Lehman Brothers. To complete your account setup, please confirm your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="background-color: #2d3748; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Confirm Account
            </a>
          </div>
          
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${confirmationUrl}</p>
          
          <p><strong>Important:</strong> This link will expire in 24 hours for security reasons.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            If you didn't create an account with Lehman Brothers, please ignore this email.
          </p>
        </div>
      `,
    });
  }
}
