# 📧 Email Service Monitoring & Troubleshooting Guide

## Overview

The KLT Mines Investment Platform uses a robust email service with multiple providers and comprehensive monitoring capabilities. This guide covers how to monitor, test, and troubleshoot email functionality.

## 🏗️ Email Service Architecture

### Providers
- **Primary**: Resend (recommended for production)
- **Fallback**: Brevo/Sendinblue
- **Alternative**: Nodemailer (SMTP)
- **Development**: Console (logs emails to console)

### Features
- ✅ Multiple provider support with automatic fallback
- ✅ Template-based emails with dynamic content
- ✅ Comprehensive error handling and logging
- ✅ Real-time monitoring and testing
- ✅ Admin dashboard for email management

## 🔧 Configuration

### Environment Variables

```bash
# Email Provider Selection
EMAIL_PROVIDER=resend  # Options: resend, brevo, nodemailer, console

# Resend Configuration (Recommended)
RESEND_API_KEY=re_your_api_key_here
RESEND_SENDER_EMAIL=onboarding@resend.dev
RESEND_SENDER_NAME=KLTMINES Investment Platform
RESEND_DOMAIN_VERIFIED=false

# Brevo Configuration (Fallback)
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=noreply@kltmines.com
BREVO_SENDER_NAME=KLTMINES Investment Platform

# SMTP Configuration (Alternative)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_SENDER_EMAIL=noreply@kltmines.com
SMTP_SENDER_NAME=KLTMINES Investment Platform

# Development
CONSOLE_EMAIL_ENABLED=true
```

## 📊 Monitoring Dashboard

### Access Email Monitoring
1. Navigate to Admin Dashboard
2. Go to Settings → Email Monitoring
3. View real-time email service status

### Dashboard Features
- **Service Status**: Active provider, fallback provider, configuration status
- **Template Testing**: Test all email templates with sample data
- **Configuration Guide**: Step-by-step setup instructions
- **Real-time Testing**: Send test emails to verify functionality

## 🧪 Testing Email Service

### 1. API Endpoints

#### Check Email Status
```bash
GET /api/v1/email/status
```

Response:
```json
{
  "success": true,
  "data": {
    "activeProvider": "Resend",
    "fallbackProvider": "Brevo",
    "activeProviderConfigured": true,
    "fallbackProviderConfigured": false,
    "availableTemplates": ["welcome", "passwordReset", "investmentConfirmation", ...]
  }
}
```

#### Test Email Configuration
```bash
POST /api/v1/email/test-configuration
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "to": "test@example.com"
}
```

#### Send Template Email
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

### 2. Command Line Testing

Run the comprehensive email test suite:

```bash
# Navigate to backend directory
cd backend

# Run email test script
npx ts-node src/scripts/test-email-service.ts
```

### 3. Admin Dashboard Testing

1. **Basic Test**: Send a simple test email
2. **Template Test**: Test specific email templates
3. **Bulk Test**: Test all available templates

## 📧 Available Email Templates

| Template | Purpose | Required Data |
|----------|---------|---------------|
| `welcome` | New user welcome | userName, userEmail, dashboardUrl |
| `passwordReset` | Password reset OTP | userName, userEmail, otpCode, resetUrl |
| `accountVerification` | Email verification | userName, userEmail, verificationCode, verificationUrl |
| `loginOtp` | Login verification | userName, userEmail, otpCode, loginUrl, ipAddress, device |
| `investmentConfirmation` | Investment created | userName, planName, amount, currency, dailyRoi, duration, startDate, expectedTotalRoi, investmentId |
| `roiPayment` | ROI payment received | userName, amount, currency, investmentName, paymentDate, paymentType, transactionId |
| `transactionConfirmation` | Transaction status | userName, type, amount, currency, status, reference, date, description |
| `investmentCompletion` | Investment completed | userName, currency, totalRoi, planName, initialAmount, completionDate, duration, investmentId |
| `referralBonus` | Referral bonus earned | userName, referralCode, referredUser, bonusAmount, availableDate |
| `welcomeBonus` | Welcome bonus | userName, bonusAmount, availableDate, userId |
| `securityAlert` | Security notification | userName, alertType, alertDate, ipAddress, location, device, alertId |
| `withdrawalRequest` | Withdrawal request | userName, amount, currency, withdrawalMethod, reference, requestDate, accountDetails |
| `withdrawalCompleted` | Withdrawal completed | userName, amount, currency, withdrawalMethod, reference, completionDate, accountDetails, transactionHash |
| `depositRequest` | Deposit request | userName, amount, currency, paymentMethod, reference, requestDate, accountDetails |
| `depositConfirmed` | Deposit confirmed | userName, amount, currency, paymentMethod, reference, confirmationDate, transactionHash |
| `withdrawalFeeUpdate` | Fee change notification | userName, newFeePercentage, updateDate, dashboardUrl |

## 🔍 Troubleshooting

### Common Issues

#### 1. "No Email Providers Configured"
**Symptoms**: All providers show as not configured
**Solution**:
```bash
# Check environment variables
echo $EMAIL_PROVIDER
echo $RESEND_API_KEY  # or relevant provider key

# Verify .env file exists and is loaded
# Restart the application after configuration changes
```

#### 2. "Provider Not Configured"
**Symptoms**: Active provider shows as not configured
**Solution**:
- Verify API keys are correct
- Check provider-specific configuration
- Test API keys with provider dashboard
- Check network connectivity

#### 3. "Template Not Found"
**Symptoms**: Email template errors
**Solution**:
- Verify template name spelling
- Check template exists in `email-templates.ts`
- Ensure all required data is provided

#### 4. "Email Not Delivered"
**Symptoms**: No delivery errors but emails not received
**Solution**:
- Check spam/junk folders
- Verify sender email domain
- Check provider delivery logs
- Test with different email addresses

### Error Logs

#### Application Logs
```bash
# Check application logs for email errors
tail -f logs/app.log | grep -i email

# Common error patterns:
# - "Failed to send email"
# - "Provider not configured"
# - "Template not found"
# - "API key invalid"
```

#### Provider Logs
- **Resend**: Check [Resend Dashboard](https://resend.com/emails)
- **Brevo**: Check [Brevo Dashboard](https://app.brevo.com/transactional-emails)
- **SMTP**: Check mail server logs

### Debug Mode

Enable detailed email logging:

```bash
# Set log level to debug
LOG_LEVEL=debug

# Enable console email provider for development
EMAIL_PROVIDER=console
CONSOLE_EMAIL_ENABLED=true
```

## 🚀 Production Best Practices

### 1. Provider Selection
- **Production**: Use Resend or Brevo
- **Development**: Use Console provider
- **Testing**: Use dedicated test accounts

### 2. Domain Verification
- Verify sender domains with providers
- Use consistent sender addresses
- Set up proper SPF/DKIM records

### 3. Monitoring
- Set up email delivery monitoring
- Monitor bounce rates
- Track email engagement metrics
- Set up alerts for failures

### 4. Rate Limiting
- Respect provider rate limits
- Implement retry logic
- Use queue system for bulk emails

### 5. Security
- Secure API keys
- Validate email addresses
- Sanitize email content
- Monitor for abuse

## 📈 Performance Optimization

### 1. Template Optimization
- Use inline CSS for better compatibility
- Optimize images and attachments
- Test across email clients

### 2. Delivery Optimization
- Use verified sender domains
- Maintain good sender reputation
- Monitor delivery rates

### 3. Caching
- Cache email templates
- Cache provider configurations
- Implement connection pooling

## 🔧 Maintenance

### Regular Tasks
1. **Weekly**: Check email delivery rates
2. **Monthly**: Review and update templates
3. **Quarterly**: Audit email configurations
4. **Annually**: Review and update email policies

### Updates
- Keep email providers updated
- Monitor for deprecated features
- Update templates for new features
- Test after major updates

## 📞 Support

### Internal Support
- Check application logs first
- Use email monitoring dashboard
- Test with email test suite
- Review this documentation

### Provider Support
- **Resend**: [support@resend.com](mailto:support@resend.com)
- **Brevo**: [support@brevo.com](mailto:support@brevo.com)
- **SMTP**: Contact your email provider

### Emergency Contacts
- **System Admin**: [admin@kltmines.com](mailto:admin@kltmines.com)
- **Technical Support**: [tech@kltmines.com](mailto:tech@kltmines.com)

---

## 📋 Quick Reference

### Environment Setup
```bash
# Quick setup for development
EMAIL_PROVIDER=console
CONSOLE_EMAIL_ENABLED=true

# Quick setup for production
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_key
RESEND_SENDER_EMAIL=onboarding@resend.dev
```

### Test Commands
```bash
# Test email service
curl -X GET http://localhost:3001/api/v1/email/status

# Test email sending (requires admin auth)
curl -X POST http://localhost:3001/api/v1/email/test-configuration \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

### Common Templates
```bash
# Welcome email
template: "welcome"
data: { userName: "John", userEmail: "john@example.com" }

# Password reset
template: "passwordReset"
data: { userName: "John", userEmail: "john@example.com", otpCode: "123456" }

# Investment confirmation
template: "investmentConfirmation"
data: { userName: "John", planName: "Gold Plan", amount: 10000, currency: "NGN" }
``` 