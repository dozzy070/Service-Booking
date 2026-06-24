// Backend/services/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// =========================================================================
// EMAIL MODE DETECTION
// =========================================================================

const getEmailMode = () => {
  return process.env.EMAIL_MODE || 'smtp';
};

const isTerminalMode = () => {
  return process.env.EMAIL_MODE === 'terminal';
};

const isSmtpMode = () => {
  return process.env.EMAIL_MODE === 'smtp' || !process.env.EMAIL_MODE;
};

// =========================================================================
// CREATE TRANSPORTER - WITH IPv4 FIX
// =========================================================================

const createTransporter = () => {
  // Terminal mode
  if (isTerminalMode()) {
    console.log('📧 EMAIL MODE: Terminal (printing to console)');
    return null;
  }

  // SMTP Mode - with IPv4 fix and better timeout handling
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('📧 EMAIL MODE: SMTP Production');
    console.log(`📧 Host: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT || 587}`);
    
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true' || false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // ✅ KEY FIX: Force IPv4 to avoid connection issues
      family: 4,
      // ✅ Better TLS settings
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3',
      },
      // ✅ Longer timeouts for slow connections
      connectionTimeout: 15000,
      socketTimeout: 15000,
      greetingTimeout: 15000,
    });
  }

  // No SMTP config - fallback to terminal
  console.log('📧 EMAIL MODE: Terminal (fallback - no SMTP config)');
  return null;
};

let transporter = null;

const getTransporter = async () => {
  if (!transporter && !isTerminalMode()) {
    transporter = createTransporter();
    
    // Verify connection
    if (transporter) {
      try {
        await transporter.verify();
        console.log('✅ SMTP Server ready to send emails');
        return transporter;
      } catch (error) {
        console.error('⚠️ SMTP Connection failed:', error.message);
        console.log('💡 Falling back to terminal mode');
        process.env.EMAIL_MODE = 'terminal';
        transporter = null;
        return null;
      }
    }
  }
  return transporter;
};

// =========================================================================
// SEND EMAIL - WITH RETRY LOGIC
// =========================================================================

export const sendEmail = async ({ to, subject, html, text, from }) => {
  // Terminal mode - just display
  if (isTerminalMode()) {
    console.log('\n' + '='.repeat(80));
    console.log('📧 EMAIL (Terminal Mode)');
    console.log('='.repeat(80));
    console.log(`📨 To: ${to}`);
    console.log(`📌 Subject: ${subject}`);
    console.log(`🕐 Time: ${new Date().toLocaleString()}`);
    console.log('-'.repeat(80));
    console.log('📝 Content:');
    console.log('-'.repeat(80));
    const plainText = html?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || text || 'No content';
    console.log(plainText);
    console.log('-'.repeat(80));
    console.log('✅ Email would be sent to:', to);
    console.log('='.repeat(80) + '\n');
    return { success: true, terminal: true, to, subject };
  }

  // SMTP Mode - send real email
  try {
    const transporter = await getTransporter();
    
    if (!transporter) {
      console.log('📧 No transporter available, using terminal mode');
      process.env.EMAIL_MODE = 'terminal';
      return sendEmail({ to, subject, html, text, from });
    }

    const mailOptions = {
      from: from || process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@servicehub.com',
      to,
      subject,
      html,
      text: text || html?.replace(/<[^>]*>/g, '') || '',
    };

    console.log(`📧 Sending email to: ${to}`);
    const info = await transporter.sendMail(mailOptions);
    
    if (info.previewUrl) {
      console.log('📧 Preview URL:', info.previewUrl);
    }
    
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId, previewUrl: info.previewUrl };
    
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    
    // If email fails, try once more with a new transporter
    transporter = null;
    try {
      const transporter = await getTransporter();
      if (transporter) {
        console.log('🔄 Retrying email send...');
        const info = await transporter.sendMail({
          from: from || process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@servicehub.com',
          to,
          subject,
          html,
          text: text || html?.replace(/<[^>]*>/g, '') || '',
        });
        console.log('✅ Email sent on retry:', info.messageId);
        return { success: true, messageId: info.messageId };
      }
    } catch (retryError) {
      console.error('❌ Retry also failed:', retryError.message);
    }
    
    // Fallback to terminal mode for this email
    console.log('📧 Falling back to terminal mode for this email');
    return sendEmail({ to, subject, html, text, from });
  }
};

// =========================================================================
// CONVENIENCE FUNCTIONS
// =========================================================================

export const sendVerificationEmail = async (user, verificationLink) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📧 Verify Your Email</h1>
      </div>
      <div class="content">
        <h2>Hello ${user.name || 'there'}!</h2>
        <p>Thank you for registering with SmartServices. Please verify your email address to complete your registration.</p>
        <p>Click the button below to verify your email:</p>
        <a href="${verificationLink}" class="button">Verify Email</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 5px; font-size: 12px;">${verificationLink}</p>
        <p>Best regards,<br>The SmartServices Team</p>
      </div>
      <div class="footer">
        <p>&copy; 2024 SmartServices. All rights reserved.</p>
        <p>This is an automated message, please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
  return await sendEmail({
    to: user.email,
    subject: '📧 Verify Your Email - SmartServices',
    html
  });
};

export const sendWelcomeEmail = async (user) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Welcome to SmartServices!</h1>
      </div>
      <div class="content">
        <h2>Hello ${user.name || 'there'}!</h2>
        <p>Thank you for joining SmartServices. We're excited to have you on board!</p>
        <p>With SmartServices, you can:</p>
        <ul>
          <li>✅ Find and book trusted service providers</li>
          <li>✅ Manage your bookings easily</li>
          <li>✅ Connect with professionals in your area</li>
          <li>✅ Track your service history</li>
        </ul>
        <p>To get started, explore our services and find the right professional for your needs.</p>
        <a href="${process.env.FRONTEND_URL || 'https://service-booking-snowy.vercel.app'}/services" class="button">Explore Services</a>
        <p>Best regards,<br>The SmartServices Team</p>
      </div>
      <div class="footer">
        <p>&copy; 2024 SmartServices. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
  return await sendEmail({
    to: user.email,
    subject: '🎉 Welcome to SmartServices!',
    html
  });
};

export const sendPasswordResetEmail = async (user, resetLink) => {
  const html = `
    <h1>🔐 Reset Your Password</h1>
    <p>Hi ${user.name},</p>
    <p>Click the link below to reset your password:</p>
    <a href="${resetLink}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:white;text-decoration:none;border-radius:5px;">Reset Password</a>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;
  return await sendEmail({
    to: user.email,
    subject: '🔐 Reset Your Password - SmartServices',
    html
  });
};

export const sendLoginNotificationEmail = async (user, loginData = {}) => {
  const ip = loginData?.ip || 'Unknown IP';
  const device = loginData?.device || 'Unknown Device';
  const time = loginData?.time || new Date().toLocaleString();

  const html = `
    <h1>🔐 New Login Detected</h1>
    <p>Hi ${user.name},</p>
    <p>We detected a new login to your account.</p>
    <p><strong>Time:</strong> ${time}</p>
    <p><strong>IP:</strong> ${ip}</p>
    <p><strong>Device:</strong> ${device}</p>
    <p>If this wasn't you, please contact support immediately.</p>
  `;
  return await sendEmail({
    to: user.email,
    subject: '🔐 New Login Detected - SmartServices',
    html
  });
};

export const sendBookingConfirmationEmail = async (user, booking) => {
  const html = `
    <h1>✅ Booking Confirmed!</h1>
    <p>Hi ${user.name},</p>
    <p>Your booking has been confirmed.</p>
    <p><strong>Service:</strong> ${booking.service_title}</p>
    <p><strong>Date:</strong> ${booking.booking_date}</p>
    <p><strong>Amount:</strong> ₦${booking.total_amount}</p>
  `;
  return await sendEmail({
    to: user.email,
    subject: '✅ Booking Confirmed - SmartServices',
    html
  });
};

export const sendPaymentConfirmationEmail = async (user, booking, transaction) => {
  const html = `
    <h1>💳 Payment Confirmed</h1>
    <p>Hi ${user.name},</p>
    <p>Your payment has been processed.</p>
    <p><strong>Amount:</strong> ₦${booking.total_amount}</p>
    <p><strong>Transaction ID:</strong> ${transaction.id}</p>
  `;
  return await sendEmail({
    to: user.email,
    subject: '💳 Payment Confirmed - SmartServices',
    html
  });
};

// =========================================================================
// TEST FUNCTIONS
// =========================================================================

export const testEmailConfig = async () => {
  if (isTerminalMode()) {
    console.log('📧 Terminal mode active - emails will be printed to console');
    return true;
  }
  
  try {
    const transporter = await getTransporter();
    if (!transporter) return false;
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('❌ Email config test failed:', error.message);
    return false;
  }
};

export const sendTestEmail = async (email) => {
  const html = `
    <h1>🧪 Test Email</h1>
    <p>This is a test email from SmartServices.</p>
    <p>Your email configuration is working correctly!</p>
    <p>Sent at: ${new Date().toLocaleString()}</p>
  `;
  return await sendEmail({
    to: email,
    subject: '🧪 Test Email - SmartServices',
    html
  });
};

// =========================================================================
// EXPORTS
// =========================================================================

export default {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendBookingConfirmationEmail,
  sendLoginNotificationEmail,
  sendPaymentConfirmationEmail,
  testEmailConfig,
  sendTestEmail,
};