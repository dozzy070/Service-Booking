import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false // For development
  }
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to send emails');
  }
});

export const sendEmail = async (to, subject, html) => {
  try {
    // Skip email sending in development if SMTP is not working
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_EMAILS === 'true') {
      console.log('📧 Email sending skipped in development mode');
      console.log(`📧 Would send to: ${to}, Subject: ${subject}`);
      return { success: true, skipped: true };
    }

    const mailOptions = {
      from: `"SmartServices" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error.message);

    // In development, don't fail - just log
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email sending failed, but continuing in development mode');
      return { success: false, error: error.message, development: true };
    }

    throw error;
  }
};

export const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to SmartServices!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to SmartServices, ${user.name}!</h2>
      <p>Thank you for joining our platform. Your account has been created successfully.</p>
      <p>You can now:</p>
      <ul>
        <li>Browse and book services from trusted providers</li>
        <li>Manage your bookings and payments</li>
        <li>Leave reviews and ratings</li>
      </ul>
      <p>If you have any questions, feel free to contact our support team.</p>
      <p>Best regards,<br>The SmartServices Team</p>
    </div>
  `;

  return await sendEmail(user.email, subject, html);
};

export const sendLoginNotificationEmail = async (user) => {
  const subject = 'New Login to Your SmartServices Account';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Login Detected</h2>
      <p>Hello ${user.name},</p>
      <p>We detected a new login to your SmartServices account.</p>
      <p>If this was you, no action is needed. If you didn't log in, please contact our support team immediately.</p>
      <p>Login time: ${new Date().toLocaleString()}</p>
      <p>Best regards,<br>The SmartServices Team</p>
    </div>
  `;

  return await sendEmail(user.email, subject, html);
};

export const sendPaymentConfirmationEmail = async (user, booking, transaction) => {
  const subject = 'Payment Confirmation - SmartServices';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Payment Confirmation</h2>
      <p>Hello ${user.name},</p>
      <p>Your payment has been processed successfully!</p>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h4>Transaction Details:</h4>
        <p><strong>Transaction ID:</strong> ${transaction.id}</p>
        <p><strong>Booking ID:</strong> ${booking.id}</p>
        <p><strong>Service:</strong> ${booking.service_title}</p>
        <p><strong>Provider:</strong> ${booking.provider_name}</p>
        <p><strong>Amount:</strong> $${booking.total_amount}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <p>Your booking is now confirmed. You can view your booking details in your dashboard.</p>
      <p>If you have any questions, please contact our support team.</p>
      <p>Best regards,<br>The SmartServices Team</p>
    </div>
  `;

  return await sendEmail(user.email, subject, html);
};