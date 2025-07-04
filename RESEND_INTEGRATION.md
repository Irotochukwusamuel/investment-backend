# 📧 Resend Email Integration Guide

## Overview

Resend has been successfully integrated into the KLT Mines Investment Platform as an email provider. This integration provides reliable email delivery with excellent developer experience.

## ✅ What's Included

- **ResendEmailProvider**: Full implementation of the EmailProvider interface
- **Automatic Fallback**: Falls back to Brevo if Resend fails
- **Template Support**: Works with all existing email templates
- **Domain Handling**: Smart domain verification handling
- **Error Handling**: Comprehensive error logging and handling

## 🚀 Quick Setup

### 1. Get Your Resend API Key
1. Sign up at [resend.com](https://resend.com)
2. Go to [API Keys](https://resend.com/api-keys)
3. Create a new API key

### 2. Configure Environment Variables

```bash
# Set Resend as your primary email provider
EMAIL_PROVIDER=resend

# Resend Configuration
RESEND_API_KEY=re_your_api_key_here
RESEND_SENDER_EMAIL=onboarding@resend.dev  # Uses verified domain
RESEND_SENDER_NAME=KLTMINES Investment Platform
RESEND_DOMAIN_VERIFIED=false  # Set to true when you verify your domain
```

### 3. Test the Integration

```bash
# Simple test
node test-resend.js

# Or test via API (requires admin authentication)
curl -X POST http://localhost:3001/api/v1/email/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -d '{"to": "your-email@example.com"}'
```

## 🔧 Configuration Options

### Email Provider Priority

Set in your `.env` file:

```bash
# Primary providers (choose one)
EMAIL_PROVIDER=resend    # Resend with Brevo fallback
EMAIL_PROVIDER=brevo     # Brevo with Resend fallback
EMAIL_PROVIDER=nodemailer # Nodemailer with Resend fallback
EMAIL_PROVIDER=console   # Console logging (development)
```

### Domain Configuration

#### Option 1: Use Resend's Verified Domain (Recommended for quick setup)
```bash
RESEND_SENDER_EMAIL=onboarding@resend.dev
RESEND_DOMAIN_VERIFIED=false
```

#### Option 2: Use Your Own Domain (Production recommended)
```bash
RESEND_SENDER_EMAIL=noreply@kltmines.com
RESEND_DOMAIN_VERIFIED=true
```

**To verify your domain:**
1. Go to [Resend Domains](https://resend.com/domains)
2. Add your domain (`kltmines.com`)
3. Follow the DNS verification steps
4. Set `RESEND_DOMAIN_VERIFIED=true`

## 📋 API Endpoints

### Check Email Status
```bash
GET /api/v1/email/status
```

Response:
```json
{
  "activeProvider": "Resend",
  "fallbackProvider": "Brevo",
  "activeProviderConfigured": true,
  "fallbackProviderConfigured": true,
  "availableTemplates": ["welcome", "passwordReset", "investmentConfirmation", ...]
}
```

### Send Test Email (Admin Only)
```bash
POST /api/v1/email/test
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "to": "test@example.com",
  "template": "welcome"  // Optional
}
```

### Send Template Email (Admin Only)
```bash
POST /api/v1/email/send-template
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "to": "user@example.com",
  "template": "welcome",
  "data": {
    "userName": "John Doe",
    "userEmail": "user@example.com",
    "dashboardUrl": "https://app.kltmines.com/dashboard"
  }
}
```

## 📧 Available Email Templates

All existing templates work with Resend:

- `welcome` - Welcome new users
- `passwordReset` - Password reset with OTP
- `investmentConfirmation` - Investment confirmation
- `roiPayment` - ROI payment notifications
- `transactionConfirmation` - Transaction confirmations
- `investmentCompletion` - Investment completion
- `referralBonus` - Referral bonus notifications
- `welcomeBonus` - Welcome bonus notifications
- `accountVerification` - Account verification
- `loginOtp` - Login OTP codes
- `securityAlert` - Security alerts
- `withdrawalRequest` - Withdrawal requests
- `withdrawalCompleted` - Withdrawal completions
- `depositRequest` - Deposit requests
- `depositConfirmed` - Deposit confirmations

## 🔍 Troubleshooting

### Common Issues

#### 1. "Domain not verified" Error
```
Error: Resend API error: The kltmines.com domain is not verified
```

**Solution**: Use the default verified domain:
```bash
RESEND_SENDER_EMAIL=onboarding@resend.dev
RESEND_DOMAIN_VERIFIED=false
```

#### 2. "Invalid API Key" Error
```
Error: Resend API error: Invalid API key
```

**Solution**: Check your API key:
1. Ensure it starts with `re_`
2. Verify it's correctly set in your environment
3. Check for extra spaces or characters

#### 3. Emails Not Sending
**Check the logs**:
```bash
# Look for Resend-related logs
grep -i "resend" logs/application.log
```

**Verify configuration**:
```bash
curl http://localhost:3001/api/v1/email/status
```

### Debug Mode

Enable detailed logging by setting:
```bash
LOG_LEVEL=debug
```

## 🚀 Production Deployment

### 1. Verify Your Domain
- Add your domain to Resend
- Complete DNS verification
- Update environment variables

### 2. Update Configuration
```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_production_key
RESEND_SENDER_EMAIL=noreply@kltmines.com
RESEND_SENDER_NAME=KLTMINES Investment Platform
RESEND_DOMAIN_VERIFIED=true
```

### 3. Test in Production
```bash
# Test with a real email
curl -X POST https://api.kltmines.com/api/v1/email/test \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -d '{"to": "admin@kltmines.com"}'
```

## 📊 Monitoring

### Email Delivery Status
Check your Resend dashboard for:
- Delivery rates
- Bounce rates
- Open rates (if tracking enabled)
- Error logs

### Application Logs
Monitor your application logs for:
- Email send confirmations
- Error messages
- Fallback provider usage

## 🔒 Security Best Practices

1. **API Key Security**
   - Store API keys in environment variables
   - Use different keys for development/production
   - Rotate keys regularly

2. **Domain Verification**
   - Always verify your sending domain in production
   - Use DKIM/SPF records for better deliverability

3. **Rate Limiting**
   - Resend has built-in rate limiting
   - Monitor your usage to avoid limits

## 📈 Performance

- **Delivery Speed**: Resend typically delivers emails within seconds
- **Reliability**: Built-in retry mechanisms and error handling
- **Scalability**: Handles high volume email sending
- **Fallback**: Automatic fallback to Brevo if Resend fails

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review application logs
3. Test with the simple test script: `node test-resend.js`
4. Verify your Resend dashboard for delivery status

## 📚 Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [Domain Verification Guide](https://resend.com/docs/dashboard/domains/introduction) 