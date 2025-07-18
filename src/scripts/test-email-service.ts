#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EmailService } from '../email/email.service';
import { Logger } from '@nestjs/common';

const logger = new Logger('EmailTestScript');

async function testEmailService() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const emailService = app.get(EmailService);

  logger.log('🧪 Starting Email Service Test Suite...\n');

  try {
    // Test 1: Check email service status
    logger.log('📊 Test 1: Checking Email Service Status');
    const status = emailService.getEmailServiceStatus();
    logger.log('✅ Email Service Status:');
    logger.log(`   Active Provider: ${status.activeProvider}`);
    logger.log(`   Fallback Provider: ${status.fallbackProvider}`);
    logger.log(`   Active Provider Configured: ${status.activeProviderConfigured}`);
    logger.log(`   Fallback Provider Configured: ${status.fallbackProviderConfigured}`);
    logger.log(`   Available Templates: ${status.availableTemplates.length}\n`);

    // Test 2: Test basic email sending
    logger.log('📧 Test 2: Testing Basic Email Sending');
    const testEmail = 'test@example.com'; // Replace with your test email
    const testResult = await emailService.testEmailConfiguration(testEmail);
    
    if (testResult.success) {
      logger.log(`✅ Basic email test successful using ${testResult.provider}`);
    } else {
      logger.log(`❌ Basic email test failed: ${testResult.message}`);
    }
    logger.log('');

    // Test 3: Test all email templates
    logger.log('📋 Test 3: Testing All Email Templates');
    const templates = status.availableTemplates;
    const testData = {
      userName: 'Test User',
      userEmail: testEmail,
      dashboardUrl: 'http://localhost:3000/dashboard',
      otpCode: '123456',
      verificationCode: '123456',
      resetUrl: 'http://localhost:3000/reset-password',
      amount: 10000,
      currency: 'NGN',
      planName: 'Test Plan',
      dailyRoi: 2.5,
      duration: 30,
      startDate: new Date(),
      expectedTotalRoi: 75,
      investmentId: 'test-inv-123',
      paymentDate: new Date(),
      paymentType: 'Daily ROI',
      transactionId: 'test-txn-123',
      investmentName: 'Test Investment',
      status: 'completed',
      type: 'deposit',
      reference: 'TEST-REF-123',
      date: new Date(),
      description: 'Test transaction',
      totalRoi: 7500,
      initialAmount: 10000,
      completionDate: new Date(),
      referralCode: 'TEST123',
      referredUser: 'Referred User',
      bonusAmount: 1000,
      availableDate: new Date(),
      userId: 'test-user-123',
      alertType: 'Suspicious Login',
      alertDate: new Date(),
      ipAddress: '192.168.1.1',
      location: 'Test Location',
      device: 'Test Device',
      alertId: 'alert-123',
      withdrawalMethod: 'Bank Transfer',
      withdrawalRequestDate: new Date(),
      accountDetails: 'Test Bank Account',
      withdrawalCompletionDate: new Date(),
      transactionHash: 'test-hash-123',
      newFeePercentage: 2.5,
      updateDate: new Date(),
      paymentMethod: 'Bank Transfer',
      depositRequestDate: new Date(),
      depositConfirmationDate: new Date(),
    };

    for (const templateName of templates) {
      try {
        logger.log(`   Testing template: ${templateName}`);
        await emailService.sendTemplateEmail(testEmail, templateName, testData);
        logger.log(`   ✅ ${templateName} - Success`);
      } catch (error) {
        logger.log(`   ❌ ${templateName} - Failed: ${error.message}`);
      }
    }
    logger.log('');

    // Test 4: Test specific email methods
    logger.log('🔧 Test 4: Testing Specific Email Methods');
    
    try {
      await emailService.sendWelcomeEmail(testEmail, 'Test User');
      logger.log('   ✅ sendWelcomeEmail - Success');
    } catch (error) {
      logger.log(`   ❌ sendWelcomeEmail - Failed: ${error.message}`);
    }

    try {
      await emailService.sendPasswordResetEmail(testEmail, 'Test User', '123456');
      logger.log('   ✅ sendPasswordResetEmail - Success');
    } catch (error) {
      logger.log(`   ❌ sendPasswordResetEmail - Failed: ${error.message}`);
    }

    try {
      await emailService.sendAccountVerificationEmail(testEmail, 'Test User', '123456');
      logger.log('   ✅ sendAccountVerificationEmail - Success');
    } catch (error) {
      logger.log(`   ❌ sendAccountVerificationEmail - Failed: ${error.message}`);
    }

    try {
      await emailService.sendLoginOtpEmail(testEmail, 'Test User', '123456');
      logger.log('   ✅ sendLoginOtpEmail - Success');
    } catch (error) {
      logger.log(`   ❌ sendLoginOtpEmail - Failed: ${error.message}`);
    }

    logger.log('');

    // Test 5: Test error handling
    logger.log('⚠️  Test 5: Testing Error Handling');
    try {
      await emailService.sendTemplateEmail('invalid-email', 'welcome', testData);
      logger.log('   ❌ Should have failed with invalid email');
    } catch (error) {
      logger.log('   ✅ Invalid email properly rejected');
    }

    try {
      await emailService.sendTemplateEmail(testEmail, 'non-existent-template', testData);
      logger.log('   ❌ Should have failed with non-existent template');
    } catch (error) {
      logger.log('   ✅ Non-existent template properly rejected');
    }
    logger.log('');

    logger.log('🎉 Email Service Test Suite Completed!');
    logger.log('');
    logger.log('📝 Summary:');
    logger.log(`   - Active Provider: ${status.activeProvider}`);
    logger.log(`   - Provider Configured: ${status.activeProviderConfigured}`);
    logger.log(`   - Templates Available: ${templates.length}`);
    logger.log(`   - Basic Email Test: ${testResult.success ? 'PASSED' : 'FAILED'}`);
    logger.log('');
    logger.log('💡 Next Steps:');
    logger.log('   1. Check your email inbox for test emails');
    logger.log('   2. Verify all templates are working correctly');
    logger.log('   3. Update environment variables if needed');
    logger.log('   4. Test with real user scenarios');

  } catch (error) {
    logger.error('❌ Email Service Test Suite Failed:', error);
  } finally {
    await app.close();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testEmailService().catch(console.error);
}

export { testEmailService }; 