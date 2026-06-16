// services/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// =========================================================================
// EMAIL TRANSPORTER CONFIGURATION - Terminal Mode
// =========================================================================

// Check if we should use terminal mode (print emails instead of sending)
const useTerminalMode = () => {
  return process.env.EMAIL_MODE === 'terminal' || 
         process.env.NODE_ENV === 'development' ||
         !process.env.EMAIL_HOST;
};

// Create transporter based on mode
const createTransporter = () => {
  // Terminal mode - just log emails, don't actually send
  if (useTerminalMode()) {
    console.log('📧 EMAIL MODE: Terminal (emails will be printed to console)');
    return null; // No transporter needed for terminal mode
  }

  // Production mode - use real SMTP
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('📧 EMAIL MODE: Production (using SMTP)');
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true' || false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 5000,
      socketTimeout: 5000
    });
  }

  // Fallback to ethereal.email for testing
  console.log('📧 EMAIL MODE: Ethereal (test emails)');
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: process.env.ETHEREAL_EMAIL || '',
      pass: process.env.ETHEREAL_PASSWORD || ''
    }
  });
};

let transporter = null;

const getTransporter = async () => {
  if (!transporter) {
    transporter = createTransporter();
    
    // If using ethereal, create a test account
    if (transporter && !process.env.EMAIL_HOST) {
      try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log('📧 Ethereal email account created:', testAccount.user);
        console.log('📨 Preview URL: https://ethereal.email/login');
      } catch (error) {
        console.error('❌ Failed to create ethereal account:', error);
      }
    }
    
    // Verify connection if using real transporter
    if (transporter && !useTerminalMode()) {
      transporter.verify((error, success) => {
        if (error) {
          console.error('⚠️ SMTP Connection Warning:', error.message);
          console.log('💡 Tip: Set EMAIL_MODE=terminal to print emails to console');
        } else {
          console.log('✅ SMTP Server is ready to send emails');
        }
      });
    }
  }
  return transporter;
};

// =========================================================================
// TERMINAL EMAIL DISPLAY
// =========================================================================

const displayEmailInTerminal = (to, subject, html, text) => {
  console.log('\n' + '='.repeat(80));
  console.log('📧 EMAIL (Terminal Mode)');
  console.log('='.repeat(80));
  console.log(`📨 To: ${to}`);
  console.log(`📌 Subject: ${subject}`);
  console.log(`🕐 Time: ${new Date().toLocaleString()}`);
  console.log('-'.repeat(80));
  console.log('📝 Content:');
  console.log('-'.repeat(80));
  
  // Display plain text if available, otherwise strip HTML
  if (text) {
    console.log(text);
  } else if (html) {
    // Strip HTML tags for terminal display
    const plainText = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    console.log(plainText);
  }
  
  console.log('-'.repeat(80));
  console.log('✅ Email would be sent to:', to);
  console.log('='.repeat(80) + '\n');
};

// =========================================================================
// EMAIL SENDING FUNCTIONS
// =========================================================================

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @param {string} options.from - Sender email (optional)
 * @returns {Promise<Object>} - Email send result
 */
export const sendEmail = async ({ to, subject, html, text, from }) => {
  try {
    // Terminal mode - just display the email
    if (useTerminalMode()) {
      displayEmailInTerminal(to, subject, html, text);
      return { 
        success: true, 
        terminal: true, 
        messageId: `terminal-${Date.now()}`,
        to,
        subject,
        preview: 'Email printed to terminal'
      };
    }

    // Production mode - send real email
    const transporter = await getTransporter();
    
    if (!transporter) {
      throw new Error('No email transporter available');
    }
    
    const mailOptions = {
      from: from || process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@servicehub.com',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Log preview URL for ethereal emails
    if (info.messageId && info.previewUrl) {
      console.log('📧 Email preview URL:', info.previewUrl);
    }
    
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId, previewUrl: info.previewUrl };
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    
    // In development, don't fail
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email sending failed in development, continuing...');
      return { success: false, error: error.message, development: true };
    }
    
    throw error;
  }
};

// =========================================================================
// TEMPLATE FUNCTIONS
// =========================================================================

export const getWelcomeEmailTemplate = (user) => {
  return `
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
        <h1>🎉 Welcome to ServiceHub!</h1>
      </div>
      <div class="content">
        <h2>Hello ${user.name || 'there'}!</h2>
        <p>Thank you for joining ServiceHub. We're excited to have you on board!</p>
        <p>With ServiceHub, you can:</p>
        <ul>
          <li>✅ Find and book trusted service providers</li>
          <li>✅ Manage your bookings easily</li>
          <li>✅ Connect with professionals in your area</li>
          <li>✅ Track your service history</li>
        </ul>
        <p>To get started, explore our services and find the right professional for your needs.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/services" class="button">Explore Services</a>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The ServiceHub Team</p>
      </div>
      <div class="footer">
        <p>&copy; 2024 ServiceHub. All rights reserved.</p>
        <p>If you didn't register for this account, please ignore this email.</p>
      </div>
    </body>
    </html>
  `;
};

export const getPasswordResetEmailTemplate = (user, resetLink) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        .warning { background: #fef3c7; padding: 15px; border-radius: 5px; color: #92400e; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔐 Reset Your Password</h1>
      </div>
      <div class="content">
        <h2>Hello ${user.name || 'there'}!</h2>
        <p>We received a request to reset your password for your ServiceHub account.</p>
        <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
        <a href="${resetLink}" class="button">Reset Password</a>
        <div class="warning">
          <p>⚠️ If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 5px; font-size: 12px;">${resetLink}</p>
        <p>Best regards,<br>The ServiceHub Team</p>
      </div>
      <div class="footer">
        <p>&copy; 2024 ServiceHub. All rights reserved.</p>
        <p>This is an automated message, please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
};

export const getVerificationEmailTemplate = (user, verificationLink) => {
  return `
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
        <p>Thank you for registering with ServiceHub. Please verify your email address to complete your registration.</p>
        <p>Click the button below to verify your email:</p>
        <a href="${verificationLink}" class="button">Verify Email</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 5px; font-size: 12px;">${verificationLink}</p>
        <p>Best regards,<br>The ServiceHub Team</p>
      </div>
      <div class="footer">
        <p>&copy; 2024 ServiceHub. All rights reserved.</p>
        <p>This is an automated message, please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
};

export const getBookingConfirmationEmailTemplate = (user, booking) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #e2e8f0; }
        .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✅ Booking Confirmed!</h1>
      </div>
      <div class="content">
        <h2>Hello ${user.name || 'there'}!</h2>
        <p>Your booking has been confirmed successfully.</p>
        <div class="details">
          <h3>Booking Details</h3>
          <p><strong>Service:</strong> ${booking.service_title || 'N/A'}</p>
          <p><strong>Date:</strong> ${booking.booking_date || 'N/A'}</p>
          <p><strong>Provider:</strong> ${booking.provider_name || 'N/A'}</p>
          <p><strong>Amount:</strong> ₦${parseFloat(booking.total_amount || 0).toLocaleString()}</p>
          <p><strong>Booking ID:</strong> ${booking.id || 'N/A'}</p>
        </div>
        <p>You can view your booking details in your dashboard.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/bookings/${booking.id}" class="button">View Booking</a>
        <p>Best regards,<br>The ServiceHub Team</p>
      </div>
      <div class="footer">
        <p>&copy; 2024 ServiceHub. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

export const getLoginNotificationEmailTemplate = (user, loginData = {}) => {
  const ip = loginData?.ip || 'Unknown IP';
  const device = loginData?.device || 'Unknown Device';
  const location = loginData?.location || 'Unknown Location';
  const time = loginData?.time || new Date().toLocaleString();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #e2e8f0; }
        .warning { background: #fef3c7; padding: 15px; border-radius: 5px; color: #92400e; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔐 New Login Detected</h1>
      </div>
      <div class="content">
        <h2>Hello ${user.name || 'there'}!</h2>
        <p>A new login was detected on your ServiceHub account.</p>
        <div class="details">
          <h3>Login Details</h3>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>IP Address:</strong> ${ip}</p>
          <p><strong>Device:</strong> ${device}</p>
          <p><strong>Location:</strong> ${location}</p>
        </div>
        <div class="warning">
          <p>⚠️ If this was NOT you, please <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/support" style="color: #3b82f6;">contact support immediately</a>.</p>
        </div>
        <p>If this was you, you can safely ignore this email.</p>
        <p>Best regards,<br>The ServiceHub Team</p>
      </div>
      <div class="footer">
        <p>&copy; 2024 ServiceHub. All rights reserved.</p>
        <p>This is an automated message, please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
};

export const getPaymentConfirmationEmailTemplate = (user, booking, transaction) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #e2e8f0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>💳 Payment Confirmation</h1>
      </div>
      <div class="content">
        <h2>Hello ${user.name || 'there'}!</h2>
        <p>Your payment has been processed successfully!</p>
        <div class="details">
          <h4>Transaction Details:</h4>
          <p><strong>Transaction ID:</strong> ${transaction.id || 'N/A'}</p>
          <p><strong>Booking ID:</strong> ${booking.id || 'N/A'}</p>
          <p><strong>Service:</strong> ${booking.service_title || 'N/A'}</p>
          <p><strong>Provider:</strong> ${booking.provider_name || 'N/A'}</p>
          <p><strong>Amount:</strong> ₦${parseFloat(booking.total_amount || 0).toLocaleString()}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>Your booking is now confirmed. You can view your booking details in your dashboard.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/bookings/${booking.id}" class="button" style="background: #059669;">View Booking</a>
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>The ServiceHub Team</p>
      </div>
      <div class="footer">
        <p>&copy; 2024 ServiceHub. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

// =========================================================================
// CONVENIENCE FUNCTIONS
// =========================================================================

export const sendWelcomeEmail = async (user) => {
  const html = getWelcomeEmailTemplate(user);
  return await sendEmail({
    to: user.email,
    subject: '🎉 Welcome to ServiceHub!',
    html
  });
};

export const sendPasswordResetEmail = async (user, resetLink) => {
  const html = getPasswordResetEmailTemplate(user, resetLink);
  return await sendEmail({
    to: user.email,
    subject: '🔐 Reset Your Password',
    html
  });
};

export const sendVerificationEmail = async (user, verificationLink) => {
  const html = getVerificationEmailTemplate(user, verificationLink);
  return await sendEmail({
    to: user.email,
    subject: '📧 Verify Your Email',
    html
  });
};

export const sendBookingConfirmationEmail = async (user, booking) => {
  const html = getBookingConfirmationEmailTemplate(user, booking);
  return await sendEmail({
    to: user.email,
    subject: '✅ Booking Confirmed!',
    html
  });
};

export const sendLoginNotificationEmail = async (user, loginData = {}) => {
  const html = getLoginNotificationEmailTemplate(user, loginData);
  return await sendEmail({
    to: user.email,
    subject: '🔐 New Login Detected',
    html
  });
};

export const sendPaymentConfirmationEmail = async (user, booking, transaction) => {
  const html = getPaymentConfirmationEmailTemplate(user, booking, transaction);
  return await sendEmail({
    to: user.email,
    subject: '💳 Payment Confirmation - ServiceHub',
    html
  });
};

// =========================================================================
// TEST FUNCTIONS
// =========================================================================

export const testEmailConfig = async () => {
  if (useTerminalMode()) {
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
    <h1>Test Email</h1>
    <p>This is a test email from ServiceHub.</p>
    <p>If you received this, your email configuration is working correctly!</p>
    <p>Sent at: ${new Date().toLocaleString()}</p>
  `;
  
  return await sendEmail({
    to: email,
    subject: '🧪 Test Email from ServiceHub',
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
  getWelcomeEmailTemplate,
  getPasswordResetEmailTemplate,
  getVerificationEmailTemplate,
  getBookingConfirmationEmailTemplate,
  getLoginNotificationEmailTemplate,
  getPaymentConfirmationEmailTemplate
};