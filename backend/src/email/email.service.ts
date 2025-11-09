import { Injectable } from '@nestjs/common';
import * as sendgrid from '@sendgrid/mail';
import { SendOtpDto } from './dto/send-otp.dto';

/**
 * Enhanced email service with modern, professional email templates.
 * Uses SendGrid as the email service provider.
 */
@Injectable()
export class EmailService {
  constructor() {
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
  }

  /**
   * Base email template with consistent styling
   */
  private getBaseTemplate(content: string, subject: string): any {
    return {
      to: '',
      from: { 
        email: process.env.SENDGRID_EMAIL_FROM || 'noreply@nexus.com',
        name: 'Nexus Platform'
      },
      subject: `${subject} | Nexus`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #334155;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
            position: relative;
        }
        
        .header::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 0;
            width: 100%;
            height: 20px;
            background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M1200 120L0 16.48 0 0 1200 0 1200 120z' fill='%23ffffff'%3E%3C/path%3E%3C/svg%3E");
            background-size: cover;
        }
        
        .logo {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 10px;
            letter-spacing: -0.5px;
        }
        
        .logo-accent {
            color: #fbbf24;
        }
        
        .content {
            padding: 50px 40px;
        }
        
        .greeting {
            font-size: 28px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .message {
            font-size: 16px;
            color: #64748b;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .highlight-box {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 30px;
            border-radius: 16px;
            margin: 30px 0;
            border: 1px solid #e2e8f0;
            text-align: center;
        }
        
        .otp-code {
            font-size: 42px;
            font-weight: 800;
            color: #667eea;
            letter-spacing: 8px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: all 0.3s ease;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
        }
        
        .warning-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fef7ed 100%);
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #f59e0b;
            margin: 25px 0;
        }
        
        .info-box {
            background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #3b82f6;
            margin: 25px 0;
        }
        
        .danger-box {
            background: linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%);
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #ef4444;
            margin: 25px 0;
        }
        
        .footer {
            text-align: center;
            padding: 30px;
            background: #f8fafc;
            color: #64748b;
            font-size: 14px;
            border-top: 1px solid #e2e8f0;
        }
        
        .social-links {
            margin: 20px 0;
        }
        
        .social-link {
            display: inline-block;
            margin: 0 10px;
            color: #64748b;
            text-decoration: none;
            transition: color 0.3s ease;
        }
        
        .social-link:hover {
            color: #667eea;
        }
        
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .greeting {
                font-size: 24px;
            }
            
            .otp-code {
                font-size: 32px;
                letter-spacing: 6px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">Nex<span class="logo-accent">u</span>s</div>
        </div>
        
        <div class="content">
            ${content}
        </div>
        
        <div class="footer">
            <p>&copy; 2024 Nexus Platform. All rights reserved.</p>
            <div class="social-links">
                <a href="#" class="social-link">Website</a>
                <a href="#" class="social-link">Support</a>
                <a href="#" class="social-link">Privacy Policy</a>
            </div>
            <p>KIIT University • Bhubaneswar, India</p>
        </div>
    </div>
</body>
</html>
      `,
    };
  }

  /**
   * Sends a One-Time Password (OTP) to a user's email address for verification.
   */
  async sendOtp(dto: SendOtpDto): Promise<void> {
    const { email, otp, name } = dto;
    
    const content = `
      <h1 class="greeting">Welcome to Nexus, ${name}! 👋</h1>
      <p class="message">We're excited to have you on board. To complete your registration, please use the following verification code:</p>
      
      <div class="highlight-box">
        <p style="margin-bottom: 15px; color: #64748b; font-weight: 500;">Your Verification Code</p>
        <div class="otp-code">${otp}</div>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 10px;">This code expires in 10 minutes</p>
      </div>
      
      <div class="warning-box">
        <p style="margin: 0; color: #92400e; font-weight: 500;">🔒 Security Notice</p>
        <p style="margin: 5px 0 0 0; color: #92400e; font-size: 14px;">Never share this code with anyone. Our team will never ask for your verification code.</p>
      </div>
      
      <p class="message" style="font-size: 14px; color: #94a3b8;">If you didn't request this code, please ignore this email.</p>
    `;

    const msg = {
      ...this.getBaseTemplate(content, 'Verify Your Email'),
      to: email,
    };

    try {
      await sendgrid.send(msg);
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new Error('Failed to send OTP email');
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

    const content = `
      <h1 class="greeting">Verify Your Email Address 📧</h1>
      <p class="message">Hello ${name}, welcome to Nexus! Please verify your email address to unlock all features of our platform.</p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${verificationUrl}" class="cta-button">Verify Email Address</a>
      </div>
      
      <div class="info-box">
        <p style="margin: 0; color: #1e40af; font-weight: 500;">💡 Can't click the button?</p>
        <p style="margin: 8px 0 0 0; color: #1e40af; font-size: 14px; word-break: break-all;">
          Copy and paste this link in your browser:<br>
          <span style="color: #667eea;">${verificationUrl}</span>
        </p>
      </div>
      
      <div class="warning-box">
        <p style="margin: 0; color: #92400e; font-weight: 500;">⏰ Link Expires in 24 Hours</p>
        <p style="margin: 5px 0 0 0; color: #92400e; font-size: 14px;">For security reasons, this verification link will expire in 24 hours.</p>
      </div>
    `;

    const msg = {
      ...this.getBaseTemplate(content, 'Email Verification'),
      to: email,
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

    const content = `
      <h1 class="greeting">Welcome to Nexus! 🎉</h1>
      <p class="message">Great news, ${name}! Your account has been approved and you're now part of the Nexus community.</p>
      
      <div class="highlight-box">
        <h3 style="color: #1e293b; margin-bottom: 20px; text-align: center;">Your Account Details</h3>
        <div style="text-align: left; max-width: 300px; margin: 0 auto;">
          <div style="margin-bottom: 15px;">
            <span style="color: #64748b; font-weight: 500;">Email:</span>
            <div style="color: #1e293b; font-weight: 600;">${email}</div>
          </div>
          <div>
            <span style="color: #64748b; font-weight: 500;">Temporary Password:</span>
            <div style="background: #1e293b; color: white; padding: 12px; border-radius: 8px; font-family: 'Courier New', monospace; letter-spacing: 2px; margin-top: 5px;">
              ${temporaryPassword}
            </div>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${loginUrl}" class="cta-button">Access Your Account</a>
      </div>
      
      <div class="warning-box">
        <p style="margin: 0; color: #92400e; font-weight: 500;">🔐 Important Security Step</p>
        <p style="margin: 8px 0 0 0; color: #92400e; font-size: 14px;">
          For your security, please change your temporary password immediately after your first login.
        </p>
      </div>
      
      <div class="info-box">
        <p style="margin: 0; color: #1e40af; font-weight: 500;">🚀 Ready to Get Started?</p>
        <p style="margin: 8px 0 0 0; color: #1e40af; font-size: 14px;">
          Explore projects, connect with peers, and showcase your work to the KIIT community.
        </p>
      </div>
    `;

    const msg = {
      ...this.getBaseTemplate(content, 'Account Approved'),
      to: email,
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
    const content = `
      <h1 class="greeting">Application Status Update</h1>
      <p class="message">Hello ${name}, thank you for your interest in joining the Nexus platform.</p>
      
      <div class="danger-box">
        <p style="margin: 0; color: #dc2626; font-weight: 500;">Application Not Approved</p>
        <p style="margin: 10px 0 0 0; color: #dc2626; font-size: 14px;">
          <strong>Reason:</strong> ${reason}
        </p>
      </div>
      
      <div class="info-box">
        <p style="margin: 0; color: #1e40af; font-weight: 500;">💡 What's Next?</p>
        <p style="margin: 8px 0 0 0; color: #1e40af; font-size: 14px;">
          You can reapply with updated documents that clearly demonstrate your affiliation with KIIT University. 
          Ensure all documents are valid, recent, and clearly visible.
        </p>
      </div>
      
      <p class="message" style="text-align: left;">
        If you believe this is a mistake or need clarification on the requirements, please don't hesitate to 
        <a href="mailto:support@nexus.com" style="color: #667eea; text-decoration: none; font-weight: 500;">contact our support team</a>.
      </p>
      
      <p class="message" style="font-size: 14px; color: #94a3b8;">
        We appreciate your understanding and hope to welcome you to Nexus in the future.
      </p>
    `;

    const msg = {
      ...this.getBaseTemplate(content, 'Application Update'),
      to: email,
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

    const content = `
      <h1 class="greeting">Reset Your Password 🔒</h1>
      <p class="message">Hello ${name}, we received a request to reset your Nexus account password.</p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${resetUrl}" class="cta-button" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">Reset Password</a>
      </div>
      
      <div class="info-box">
        <p style="margin: 0; color: #1e40af; font-weight: 500;">🔗 Alternative Method</p>
        <p style="margin: 8px 0 0 0; color: #1e40af; font-size: 14px; word-break: break-all;">
          If the button doesn't work, copy this link:<br>
          <span style="color: #667eea;">${resetUrl}</span>
        </p>
      </div>
      
      <div class="warning-box">
        <p style="margin: 0; color: #92400e; font-weight: 500;">⏰ Urgent Action Required</p>
        <p style="margin: 8px 0 0 0; color: #92400e; font-size: 14px;">
          This password reset link will expire in <strong>1 hour</strong>. 
          If you didn't request this reset, please secure your account immediately.
        </p>
      </div>
      
      <div class="danger-box">
        <p style="margin: 0; color: #dc2626; font-weight: 500;">🚫 Not You?</p>
        <p style="margin: 8px 0 0 0; color: #dc2626; font-size: 14px;">
          If you didn't request this password reset, someone might be trying to access your account. 
          Please <a href="mailto:support@nexus.com" style="color: #dc2626; font-weight: 500;">contact support</a> immediately.
        </p>
      </div>
    `;

    const msg = {
      ...this.getBaseTemplate(content, 'Password Reset'),
      to: email,
    };

    try {
      await sendgrid.send(msg);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }
}