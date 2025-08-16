import { Injectable } from '@nestjs/common';
import * as sendgrid from '@sendgrid/mail';
import { SendOtpDto } from './dto/send-otp.dto';

/**
 * Service for sending emails, primarily for OTP verification.
 * Uses SendGrid as the email service provider.
 */
@Injectable()
export class EmailService {
  constructor() {
    // Set SendGrid API key from environment variables.
    // Ensure SENDGRID_API_KEY is configured in your .env file.
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
  }

  /**
   * Sends a One-Time Password (OTP) to a user's email address for verification.
   * The email content is a pre-defined HTML template.
   * @param dto - Data transfer object containing the recipient's email, OTP, and name.
   * @returns A promise that resolves when the email has been sent.
   * @throws Logs an error to the console if email sending fails.
   */
  async sendOtp(dto: SendOtpDto): Promise<void> {
    const { email, otp, name } = dto;
    const msg = {
      to: email,
      from: '22053431@kiit.ac.in',
      subject: 'Welcome to Nexus! Verify Your Email',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="text-align: center; color: #333;">Welcome, ${name}!</h2>
          <p style="font-size: 16px;">Thank you for registering with Nexus. Please use the following One-Time Password (OTP) to verify your email address:</p>
          <div style="text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; padding: 10px; background-color: #f5f5f5; border-radius: 5px;">
            ${otp}
          </div>
          <p style="font-size: 16px;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
          <p style="font-size: 14px; color: #777;">Best regards,<br/>The Nexus Team</p>
        </div>
      `,
    };

    try {
      await sendgrid.send(msg);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}
