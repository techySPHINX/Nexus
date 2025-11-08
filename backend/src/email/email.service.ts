import { Injectable } from '@nestjs/common';
import * as sendgrid from '@sendgrid/mail';
import { SendOtpDto } from './dto/send-otp.dto';

/**
 * Enhanced email service with verification and notification emails.
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

  /**
   * Send email verification link
   */
  async sendVerificationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const msg = {
      to: email,
      from: '22053431@kiit.ac.in',
      subject: 'Verify Your Email - Nexus',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="text-align: center; color: #333;">Verify Your Email</h2>
          <p style="font-size: 16px;">Hello ${name},</p>
          <p style="font-size: 16px;">Please click the button below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
          </div>
          <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="font-size: 14px; word-break: break-all; color: #007bff;">${verificationUrl}</p>
          <p style="font-size: 14px; color: #777;">This link will expire in 24 hours.</p>
          <p style="font-size: 14px; color: #777;">Best regards,<br/>The Nexus Team</p>
        </div>
      `,
    };

    try {
      await sendgrid.send(msg);
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send account approval notification
   */
  async sendAccountApprovalEmail(
    email: string,
    name: string,
    temporaryPassword: string,
  ): Promise<void> {
    const loginUrl = `${process.env.FRONTEND_URL}/login`;

    const msg = {
      to: email,
      from: '22053431@kiit.ac.in',
      subject: 'Account Approved - Welcome to Nexus!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="text-align: center; color: #28a745;">Account Approved! 🎉</h2>
          <p style="font-size: 16px;">Congratulations ${name}!</p>
          <p style="font-size: 16px;">Your account has been approved by our admin team. You can now access the Nexus platform.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Your Login Credentials:</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background-color: #e9ecef; padding: 2px 6px; border-radius: 3px;">${temporaryPassword}</code></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Nexus</a>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;"><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
          </div>
          
          <p style="font-size: 14px; color: #777; margin-top: 30px;">Welcome to the Nexus community!<br/>The Nexus Team</p>
        </div>
      `,
    };

    try {
      await sendgrid.send(msg);
    } catch (error) {
      console.error('Error sending approval email:', error);
      throw new Error('Failed to send approval email');
    }
  }

  /**
   * Send account rejection notification
   */
  async sendAccountRejectionEmail(
    email: string,
    name: string,
    reason: string,
  ): Promise<void> {
    const msg = {
      to: email,
      from: '22053431@kiit.ac.in',
      subject: 'Account Application Update - Nexus',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="text-align: center; color: #dc3545;">Account Application Update</h2>
          <p style="font-size: 16px;">Hello ${name},</p>
          <p style="font-size: 16px;">Thank you for your interest in joining the Nexus platform. After reviewing your application, we are unable to approve your account at this time.</p>
          
          <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545; margin: 20px 0;">
            <p style="margin: 0; color: #721c24;"><strong>Reason:</strong> ${reason}</p>
          </div>
          
          <p style="font-size: 16px;">You can reapply by submitting new documents that meet our verification requirements. Please ensure all documents are clear, valid, and properly demonstrate your affiliation with KIIT.</p>
          
          <p style="font-size: 14px; color: #777;">If you have any questions, please contact our support team.</p>
          <p style="font-size: 14px; color: #777;">Best regards,<br/>The Nexus Team</p>
        </div>
      `,
    };

    try {
      await sendgrid.send(msg);
    } catch (error) {
      console.error('Error sending rejection email:', error);
      throw new Error('Failed to send rejection email');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string,
  ): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const msg = {
      to: email,
      from: '22053431@kiit.ac.in',
      subject: 'Password Reset Request - Nexus',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="text-align: center; color: #333;">Password Reset Request</h2>
          <p style="font-size: 16px;">Hello ${name},</p>
          <p style="font-size: 16px;">We received a request to reset your password. Click the button below to create a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          
          <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="font-size: 14px; word-break: break-all; color: #dc3545;">${resetUrl}</p>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.</p>
          </div>
          
          <p style="font-size: 14px; color: #777;">Best regards,<br/>The Nexus Team</p>
        </div>
      `,
    };

    try {
      await sendgrid.send(msg);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }
}
