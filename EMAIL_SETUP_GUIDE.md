# Email Configuration Guide

## Overview

The Service Booking application uses Gmail's SMTP server to send emails for:
- User registration welcome emails
- Login notifications
- Booking confirmations
- Password reset notifications
- Admin notifications

## Current Status

**Development Environment**: Email sending is currently **DISABLED** (`SKIP_EMAILS=true`)

This prevents timeouts and allows development without proper SMTP credentials. In production or when you want to enable email functionality, follow the steps below.

## How to Enable Email Sending

### Step 1: Enable Gmail SMTP

1. **Create or Use a Gmail Account**
   - You need a Gmail account with 2-Factor Authentication (2FA) enabled

2. **Enable Less Secure App Access** (Alternative Method)
   - Go to [myaccount.google.com](https://myaccount.google.com)
   - Click "Security" in the left sidebar
   - Scroll down to "Less secure app access"
   - Turn ON "Allow less secure apps"
   - **OR** Use an App Password (Recommended - see below)

3. **Generate an App Password** (Recommended - More Secure)
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Make sure 2-Factor Authentication is enabled
   - Select "Mail" as the app
   - Select "Windows Computer" (or your device)
   - Google will generate a 16-character password
   - Copy this password (remove spaces if any)

### Step 2: Update Environment Variables

Edit the `.env` file in the Backend directory:

```env
# Set to false to enable email sending
SKIP_EMAILS=false

# Gmail SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx  # 16-character app password (without spaces)
EMAIL_FROM=your-email@gmail.com
```

Replace:
- `your-email@gmail.com` with your actual Gmail address
- `xxxx xxxx xxxx xxxx` with the 16-character app password (remove spaces)

### Step 3: Restart the Backend Server

```bash
# Stop the current server (Ctrl+C)
# Restart with:
npm start
```

You should see in the logs:
```
✅ SMTP Server is ready to send emails
```

## Email Configuration in Details

### Email Sending Events

The system will send emails for:

1. **Registration** → Welcome email to new users
2. **Login** → Login notification to user
3. **Password Reset** → Reset link to user email
4. **Booking Confirmation** → Confirmation to customer and provider
5. **Service Completion** → Notification to customer
6. **Review Reminder** → Request to leave review

### Email Templates Location

Email templates are defined in:
- `Backend/config/email.js` - Contains all email sending functions
- Custom HTML templates in send functions

### Testing Email Sending

Once enabled, test with:

```bash
# Register a new account
# Check logs to see if email was "sent"
# (Logs will show success even if there are network issues)

# Monitor backend logs for messages like:
# ✅ Email sent successfully: <message-id>
# or
# ❌ Email send error: <error-details>
```

## Troubleshooting

### Error: "SMTP Connection Error"

**Cause**: Network/connectivity issue reaching Gmail's SMTP server

**Solutions**:
1. **Check Internet Connection**: Ensure your server has internet access
2. **Firewall/Network Rules**: Verify port 587 is not blocked
3. **Gmail Security Settings**: 
   - Verify "Less secure app access" is enabled OR
   - Regenerate a new App Password
4. **Credentials**: Double-check email and password (no extra spaces)

### Error: "Invalid credentials"

**Cause**: Wrong email or app password

**Solutions**:
1. Verify `EMAIL_USER` matches your Gmail address exactly
2. Ensure `EMAIL_PASS` is the 16-character app password (not your Gmail password)
3. Remove any spaces from the app password
4. Regenerate a new app password from [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

### Error: "connect ENETUNREACH"

**Cause**: Cannot reach Gmail SMTP server (network/firewall issue)

**Solutions**:
1. Check if your ISP/network allows SMTP connections to external servers
2. Try using a VPN or different network
3. Contact your network administrator
4. Keep `SKIP_EMAILS=true` for development without email

### Emails Are Being Skipped

**Cause**: `SKIP_EMAILS=true` is set in your .env

**Solution**: Change to `SKIP_EMAILS=false` and restart the server

## Production Deployment

### Render.com Deployment

When deploying to Render:

1. **Set Environment Variables in Render Dashboard:**
   - Go to your Render service
   - Click "Environment"
   - Add the email variables:
     - `SKIP_EMAILS=false`
     - `EMAIL_HOST=smtp.gmail.com`
     - `EMAIL_PORT=587`
     - `EMAIL_USER=your-email@gmail.com`
     - `EMAIL_PASS=xxxx xxxx xxxx xxxx`

2. **Redeploy the Service**
   - Go to "Manual Deploy"
   - Select "Latest" and click "Deploy"
   - Wait for deployment to complete

3. **Monitor Logs**
   - Check the logs to ensure emails are being sent correctly
   - Look for "SMTP Server is ready" message

### Vercel Frontend

Email sending doesn't affect the frontend, as emails are handled server-side only.

## Alternative Email Services

If you want to use a different email service instead of Gmail:

### SendGrid
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_api_key
```

### Mailgun
```env
EMAIL_SERVICE=mailgun
MAILGUN_DOMAIN=your_domain
MAILGUN_API_KEY=your_api_key
```

### AWS SES
```env
EMAIL_SERVICE=ses
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

Currently, the application is configured for Gmail only. To use these services, you would need to update `Backend/config/email.js` to integrate with those providers.

## Security Notes

1. **Never commit .env file** - Always use `.env.example` template
2. **App Passwords vs Account Passwords** - Never use your actual Gmail password
3. **Rotate Passwords Regularly** - Generate new app passwords periodically
4. **Review Connected Apps** - Check [myaccount.google.com/security](https://myaccount.google.com/security) for connected apps

## FAQ

**Q: Why am I getting "timeout" errors on login?**
A: If email sending is enabled but SMTP fails, the login endpoint waits for email completion. Set `SKIP_EMAILS=true` during development, or fix your SMTP configuration.

**Q: Can I use my main Gmail password?**
A: No. Gmail requires App Passwords for applications. Using your main password will fail. Generate one at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).

**Q: Will emails work on localhost?**
A: Yes, but only if:
1. Your server has internet connectivity
2. Port 587 is not blocked by firewall
3. SMTP credentials are correct
4. Emails might not be visible in Gmail inbox if from=sender matches recipient

**Q: How do I test email without sending real emails?**
A: Keep `SKIP_EMAILS=true` in development. The system will log what emails would be sent but won't actually send them. This is perfect for testing!

**Q: What happens if email fails?**
A: In development mode (`NODE_ENV=development`), email failures are logged but don't affect the user experience. Users can still login/register/perform actions even if email sending fails.

## Support

For more information:
- [Gmail App Passwords Guide](https://support.google.com/accounts/answer/185833)
- [Gmail SMTP Configuration](https://support.google.com/mail/answer/7126229)
- [Nodemailer Documentation](https://nodemailer.com/smtp/gmail/)
