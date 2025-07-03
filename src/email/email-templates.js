"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTemplates = void 0;
exports.emailTemplates = {
    welcome: {
        subject: 'Welcome to KLT Mines Investment Platform',
        html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to KLT Mines</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff5858 0%, #ff7e5f 50%, #ff9966 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #ff5858 0%, #ff7e5f 50%, #ff9966 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to KLT Mines!</h1>
              <p>Your Investment Journey Begins Here</p>
            </div>
            <div class="content">
              <h2>Hello ${data.userName}!</h2>
              <p>Welcome to KLT Mines Investment Platform! We're thrilled to have you join our community of smart investors.</p>
              
              <div class="highlight">
                <h3>🚀 What's Next?</h3>
                <ul>
                  <li>Explore our investment plans</li>
                  <li>Start your first investment</li>
                  <li>Earn daily returns</li>
                  <li>Build your wealth</li>
                </ul>
              </div>
              
              <p>Your account has been successfully created and you're ready to start investing!</p>
              
              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
              </div>
              
              <p><strong>Need Help?</strong> Our support team is here to assist you with any questions.</p>
            </div>
            <div class="footer">
              <p>© 2024 KLT Mines Investment Platform. All rights reserved.</p>
              <p>This email was sent to ${data.userEmail}</p>
            </div>
          </div>
        </body>
      </html>
    `
    },
    passwordReset: {
        subject: 'Password Reset OTP - KLT Mines',
        html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset OTP</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff5858 0%, #ff7e5f 50%, #ff9966 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #ff5858 0%, #ff7e5f 50%, #ff9966 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
            .otp-container { background: #e3f2fd; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #2196f3; text-align: center; }
            .otp-code { font-size: 3em; font-weight: bold; color: #2196f3; letter-spacing: 8px; margin: 15px 0; font-family: 'Courier New', monospace; }
            .otp-label { font-size: 1.2em; color: #555; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset OTP</h1>
              <p>Secure Your Account</p>
            </div>
            <div class="content">
              <h2>Hello ${data.userName}!</h2>
              <p>We received a request to reset your password for your KLT Mines account.</p>
              
              <div class="otp-container">
                <div class="otp-label">Your One-Time Password (OTP)</div>
                <div class="otp-code">${data.otpCode}</div>
                <p style="margin: 10px 0 0 0; color: #666;">Enter this code in the password reset page</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${data.resetUrl}" class="button">Reset Password</a>
              </div>
              
              <div class="warning">
                <h3>⚠️ Important Security Notice</h3>
                <ul>
                  <li>This OTP will expire in 10 minutes</li>
                  <li>If you didn't request this, please ignore this email</li>
                  <li>Never share your OTP with anyone</li>
                  <li>Our team will never ask for your OTP</li>
                </ul>
              </div>
              
              <p><strong>How to use this OTP:</strong></p>
              <ol>
                <li>Click the "Reset Password" button above</li>
                <li>Enter the OTP code: <strong>${data.otpCode}</strong></li>
                <li>Create your new password</li>
                <li>Save your new password securely</li>
              </ol>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #007bff;">${data.resetUrl}</p>
            </div>
            <div class="footer">
              <p>© 2024 KLT Mines Investment Platform. All rights reserved.</p>
              <p>This email was sent to ${data.userEmail}</p>
            </div>
          </div>
        </body>
      </html>
    `
    },
    investmentConfirmation: {
        subject: 'Investment Confirmation - KLT Mines',
        html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Investment Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff5858 0%, #ff7e5f 50%, #ff9966 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #ff5858 0%, #ff7e5f 50%, #ff9966 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .investment-details { background: #e8f5e8; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #28a745; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 5px 0; border-bottom: 1px solid #ddd; }
            .detail-label { font-weight: bold; color: #555; }
            .detail-value { color: #333; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Investment Confirmed!</h1>
              <p>Your Investment is Now Active</p>
            </div>
            <div class="content">
              <h2>Congratulations ${data.userName}!</h2>
              <p>Your investment has been successfully created and is now active. Here are the details:</p>
              
              <div class="investment-details">
                <h3>📊 Investment Details</h3>
                <div class="detail-row">
                  <span class="detail-label">Investment Plan:</span>
                  <span class="detail-value">${data.planName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Amount Invested:</span>
                  <span class="detail-value">${data.currency} ${data.amount.toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Daily ROI:</span>
                  <span class="detail-value">${data.dailyRoi}%</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Duration:</span>
                  <span class="detail-value">${data.duration} days</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Start Date:</span>
                  <span class="detail-value">${new Date(data.startDate).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Expected Total ROI:</span>
                  <span class="detail-value">${data.expectedTotalRoi}%</span>
                </div>
              </div>
              
              <p>🎯 <strong>What happens next?</strong></p>
              <ul>
                <li>Your investment starts earning daily returns</li>
                <li>You'll receive ROI payments according to your plan</li>
                <li>Track your progress in your dashboard</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">View Investment</a>
              </div>
            </div>
            <div class="footer">
              <p>© 2024 KLT Mines Investment Platform. All rights reserved.</p>
              <p>Investment ID: ${data.investmentId}</p>
            </div>
          </div>
        </body>
      </html>
    `
    },
    roiPayment: {
        subject: 'ROI Payment Received - KLT Mines',
        html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ROI Payment Received</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 50%, #17a2b8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 50%, #17a2b8 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .payment-details { background: #d4edda; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #28a745; }
            .amount { font-size: 2em; font-weight: bold; color: #28a745; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 ROI Payment Received!</h1>
              <p>Your Investment is Growing</p>
            </div>
            <div class="content">
              <h2>Great news ${data.userName}!</h2>
              <p>You've received an ROI payment from your investment. Your money is working for you!</p>
              
              <div class="amount">
                +${data.currency} ${data.amount.toLocaleString()}
              </div>
              
              <div class="payment-details">
                <h3>📈 Payment Details</h3>
                <p><strong>Investment:</strong> ${data.investmentName}</p>
                <p><strong>Payment Date:</strong> ${new Date(data.paymentDate).toLocaleDateString()}</p>
                <p><strong>Payment Type:</strong> ${data.paymentType}</p>
                <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
              </div>
              
              <p>🎉 Your funds have been credited to your wallet and are ready for withdrawal or reinvestment.</p>
              
              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">View Wallet</a>
              </div>
            </div>
            <div class="footer">
              <p>© 2024 KLT Mines Investment Platform. All rights reserved.</p>
              <p>Transaction ID: ${data.transactionId}</p>
            </div>
          </div>
        </body>
      </html>
    `
    },
    transactionConfirmation: {
        subject: 'Transaction ${status} - KLT Mines',
        html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Transaction ${data.status}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #007bff 0%, #6610f2 50%, #6f42c1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #007bff 0%, #6610f2 50%, #6f42c1 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .transaction-details { background: #e3f2fd; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #007bff; }
            .status-completed { color: #28a745; font-weight: bold; }
            .status-pending { color: #ffc107; font-weight: bold; }
            .status-failed { color: #dc3545; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💳 Transaction ${data.status.toUpperCase()}</h1>
              <p>Transaction Update</p>
            </div>
            <div class="content">
              <h2>Hello ${data.userName}!</h2>
              <p>Your transaction has been <span class="status-${data.status}">${data.status}</span>.</p>
              
              <div class="transaction-details">
                <h3>📋 Transaction Details</h3>
                <p><strong>Type:</strong> ${data.type}</p>
                <p><strong>Amount:</strong> ${data.currency} ${data.amount.toLocaleString()}</p>
                <p><strong>Reference:</strong> ${data.reference}</p>
                <p><strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span class="status-${data.status}">${data.status.toUpperCase()}</span></p>
                ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
              </div>
              
              ${data.status === 'completed' ? `
                <p>✅ Your transaction has been processed successfully!</p>
              ` : data.status === 'pending' ? `
                <p>⏳ Your transaction is being processed. This may take a few minutes.</p>
              ` : `
                <p>❌ Your transaction could not be completed. Please try again or contact support.</p>
              `}
              
              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">View Transaction</a>
              </div>
            </div>
            <div class="footer">
              <p>© 2024 KLT Mines Investment Platform. All rights reserved.</p>
              <p>Reference: ${data.reference}</p>
            </div>
          </div>
        </body>
      </html>
    `
    },
    investmentCompletion: {
        subject: 'Investment Completed - KLT Mines',
        html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Investment Completed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 50%, #17a2b8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 50%, #17a2b8 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .summary { background: #d4edda; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #28a745; }
            .total-earned { font-size: 2em; font-weight: bold; color: #28a745; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Investment Completed!</h1>
              <p>Congratulations on Your Success</p>
            </div>
            <div class="content">
              <h2>Congratulations ${data.userName}!</h2>
              <p>Your investment has been completed successfully! You've reached the end of your investment journey and earned great returns.</p>
              
              <div class="total-earned">
                +${data.currency} ${data.totalRoi.toLocaleString()}
              </div>
              <p style="text-align: center; font-size: 1.2em; color: #28a745;">Total ROI Earned</p>
              
              <div class="summary">
                <h3>📊 Investment Summary</h3>
                <p><strong>Plan:</strong> ${data.planName}</p>
                <p><strong>Initial Investment:</strong> ${data.currency} ${data.initialAmount.toLocaleString()}</p>
                <p><strong>Total ROI Earned:</strong> ${data.currency} ${data.totalRoi.toLocaleString()}</p>
                <p><strong>Completion Date:</strong> ${new Date(data.completionDate).toLocaleDateString()}</p>
                <p><strong>Duration:</strong> ${data.duration} days</p>
              </div>
              
              <p>💰 Your funds have been returned to your wallet along with all earned returns. You can now:</p>
              <ul>
                <li>Withdraw your earnings</li>
                <li>Start a new investment</li>
                <li>Explore other investment opportunities</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">View Wallet</a>
              </div>
            </div>
            <div class="footer">
              <p>© 2024 KLT Mines Investment Platform. All rights reserved.</p>
              <p>Investment ID: ${data.investmentId}</p>
            </div>
          </div>
        </body>
      </html>
    `
    },
    referralBonus: {
        subject: 'Referral Bonus Earned - KLT Mines',
        html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Referral Bonus Earned</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ffc107 0%, #fd7e14 50%, #e83e8c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #ffc107 0%, #fd7e14 50%, #e83e8c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .bonus-details { background: #fff3cd; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ffc107; }
            .bonus-amount { font-size: 2em; font-weight: bold; color: #ffc107; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎁 Referral Bonus Earned!</h1>
              <p>You've Earned a Bonus</p>
            </div>
            <div class="content">
              <h2>Congratulations ${data.userName}!</h2>
              <p>You've earned a referral bonus! Someone you referred has made their first investment.</p>
              
              <div class="bonus-amount">
                +${data.currency} ${data.bonusAmount.toLocaleString()}
              </div>
              <p style="text-align: center; font-size: 1.2em; color: #ffc107;">Referral Bonus</p>
              
              <div class="bonus-details">
                <h3>🎯 Referral Details</h3>
                <p><strong>Referred User:</strong> ${data.referredUserName}</p>
                <p><strong>Investment Amount:</strong> ${data.currency} ${data.referredInvestmentAmount.toLocaleString()}</p>
                <p><strong>Bonus Percentage:</strong> ${data.bonusPercentage}%</p>
                <p><strong>Date Earned:</strong> ${new Date(data.dateEarned).toLocaleDateString()}</p>
              </div>
              
              <p>💰 Your referral bonus has been credited to your wallet. Keep referring friends to earn more bonuses!</p>
              
              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">View Wallet</a>
              </div>
            </div>
            <div class="footer">
              <p>© 2024 KLT Mines Investment Platform. All rights reserved.</p>
              <p>Referral ID: ${data.referralId}</p>
            </div>
          </div>
        </body>
      </html>
    `
    },
    welcomeBonus: {
        subject: 'Welcome Bonus Available - KLT Mines',
        html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome Bonus Available</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 50%, #fd7e14 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 50%, #fd7e14 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .bonus-info { background: #f8d7da; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #dc3545; }
            .bonus-amount { font-size: 2em; font-weight: bold; color: #6f42c1; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome Bonus Available!</h1>
              <p>Claim Your Special Bonus</p>
            </div>
            <div class="content">
              <h2>Hello ${data.userName}!</h2>
              <p>Great news! Your welcome bonus is now available for withdrawal.</p>
              
              <div class="bonus-amount">
                ${data.currency} ${data.bonusAmount.toLocaleString()}
              </div>
              <p style="text-align: center; font-size: 1.2em; color: #6f42c1;">Welcome Bonus</p>
              
              <div class="bonus-info">
                <h3>🎁 Bonus Details</h3>
                <p><strong>Bonus Type:</strong> Welcome Bonus</p>
                <p><strong>Amount:</strong> ${data.currency} ${data.bonusAmount.toLocaleString()}</p>
                <p><strong>Available Since:</strong> ${new Date(data.availableDate).toLocaleDateString()}</p>
                <p><strong>Expires:</strong> Never (bonus doesn't expire)</p>
              </div>
              
              <p>💰 This bonus is yours to keep! You can withdraw it to your wallet or use it for new investments.</p>
              
              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">Claim Bonus</a>
              </div>
            </div>
            <div class="footer">
              <p>© 2024 KLT Mines Investment Platform. All rights reserved.</p>
              <p>User ID: ${data.userId}</p>
            </div>
          </div>
        </body>
      </html>
    `
    },
    accountVerification: {
        subject: 'Verify Your Account - KLT Mines',
        html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Verification</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #17a2b8 0%, #20c997 50%, #28a745 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #17a2b8 0%, #20c997 50%, #28a745 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .verification-code { background: #e3f2fd; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #17a2b8; text-align: center; }
            .code { font-size: 2.5em; font-weight: bold; color: #17a2b8; letter-spacing: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Verify Your Account</h1>
              <p>Complete Your Registration</p>
            </div>
            <div class="content">
              <h2>Hello ${data.userName}!</h2>
              <p>Please verify your email address to complete your account registration.</p>
              
              <div class="verification-code">
                <h3>Your Verification Code</h3>
                <div class="code">${data.verificationCode}</div>
                <p>Enter this code in the verification page</p>
              </div>
              
              <p>⏰ This code will expire in 10 minutes for security reasons.</p>
              
              <div style="text-align: center;">
                <a href="${data.verificationUrl}" class="button">Verify Account</a>
              </div>
              
              <p>If you didn't create an account with us, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2024 KLT Mines Investment Platform. All rights reserved.</p>
              <p>This email was sent to ${data.userEmail}</p>
            </div>
          </div>
        </body>
      </html>
    `
    },
    securityAlert: {
        subject: 'Security Alert - KLT Mines',
        html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Security Alert</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc3545 0%, #fd7e14 50%, #ffc107 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #dc3545 0%, #fd7e14 50%, #ffc107 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .alert-details { background: #f8d7da; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #dc3545; }
            .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Security Alert</h1>
              <p>Account Security Notice</p>
            </div>
            <div class="content">
              <h2>Hello ${data.userName}!</h2>
              <p>We detected ${data.alertType} activity on your account.</p>
              
              <div class="alert-details">
                <h3>🚨 Alert Details</h3>
                <p><strong>Alert Type:</strong> ${data.alertType}</p>
                <p><strong>Date & Time:</strong> ${new Date(data.alertDate).toLocaleString()}</p>
                <p><strong>IP Address:</strong> ${data.ipAddress}</p>
                <p><strong>Location:</strong> ${data.location}</p>
                <p><strong>Device:</strong> ${data.device}</p>
              </div>
              
              <div class="warning">
                <h3>🔒 Security Recommendations</h3>
                <ul>
                  <li>If this wasn't you, change your password immediately</li>
                  <li>Enable two-factor authentication</li>
                  <li>Review your recent account activity</li>
                  <li>Contact support if you have concerns</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${data.securityUrl}" class="button">Review Account</a>
              </div>
              
              <p>If you recognize this activity, no action is needed.</p>
            </div>
            <div class="footer">
              <p>© 2024 KLT Mines Investment Platform. All rights reserved.</p>
              <p>Alert ID: ${data.alertId}</p>
            </div>
          </div>
        </body>
      </html>
    `
    },
    loginOtp: {
        subject: 'Login Verification OTP - KLT Mines',
        html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Login Verification OTP</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #007bff 0%, #6610f2 50%, #6f42c1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #007bff 0%, #6610f2 50%, #6f42c1 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
            .otp-container { background: #e3f2fd; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #2196f3; text-align: center; }
            .otp-code { font-size: 3em; font-weight: bold; color: #2196f3; letter-spacing: 8px; margin: 15px 0; font-family: 'Courier New', monospace; }
            .otp-label { font-size: 1.2em; color: #555; margin-bottom: 10px; }
            .login-info { background: #e8f5e8; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #28a745; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Login Verification</h1>
              <p>Complete Your Login</p>
            </div>
            <div class="content">
              <h2>Hello ${data.userName}!</h2>
              <p>We received a login request for your KLT Mines account. Please verify your identity with the OTP below.</p>
              
              <div class="login-info">
                <h3>📱 Login Details</h3>
                <p><strong>Email:</strong> ${data.userEmail}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>IP Address:</strong> ${data.ipAddress || 'Unknown'}</p>
                <p><strong>Device:</strong> ${data.device || 'Unknown'}</p>
              </div>
              
              <div class="otp-container">
                <div class="otp-label">Your Login Verification Code</div>
                <div class="otp-code">${data.otpCode}</div>
                <p style="margin: 10px 0 0 0; color: #666;">Enter this code to complete your login</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${data.loginUrl}" class="button">Complete Login</a>
              </div>
              
              <div class="warning">
                <h3>⚠️ Security Notice</h3>
                <ul>
                  <li>This OTP will expire in 10 minutes</li>
                  <li>If you didn't attempt to login, please change your password immediately</li>
                  <li>Never share your OTP with anyone</li>
                  <li>Our team will never ask for your OTP</li>
                </ul>
              </div>
              
              <p><strong>How to use this OTP:</strong></p>
              <ol>
                <li>Return to the login page</li>
                <li>Enter the OTP code: <strong>${data.otpCode}</strong></li>
                <li>Complete your login process</li>
              </ol>
              
              <p>If you didn't attempt to login, please contact our support team immediately.</p>
            </div>
            <div class="footer">
              <p>© 2024 KLT Mines Investment Platform. All rights reserved.</p>
              <p>This email was sent to ${data.userEmail}</p>
            </div>
          </div>
        </body>
      </html>
    `
    },
    withdrawalRequest: {
        subject: 'Withdrawal Request Received - KLT Mines',
        html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Withdrawal Request Received</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc3545 0%, #fd7e14 50%, #ffc107 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #dc3545 0%, #fd7e14 50%, #ffc107 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .withdrawal-details { background: #f8d7da; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #dc3545; }
            .amount { font-size: 2em; font-weight: bold; color: #dc3545; text-align: center; margin: 20px 0; }
            .status-pending { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Withdrawal Request Received</h1>
              <p>Your Withdrawal is Being Processed</p>
            </div>
            <div class="content">
              <h2>Hello ${data.userName}!</h2>
              <p>We've received your withdrawal request and it's now being processed by our team.</p>
              
              <div class="amount">
                -${data.currency} ${data.amount.toLocaleString()}
              </div>
              <p style="text-align: center; font-size: 1.2em; color: #dc3545;">Withdrawal Amount</p>
              
              <div class="withdrawal-details">
                <h3>📋 Withdrawal Details</h3>
                <p><strong>Amount:</strong> ${data.currency} ${data.amount.toLocaleString()}</p>
                <p><strong>Withdrawal Method:</strong> ${data.withdrawalMethod}</p>
                <p><strong>Reference:</strong> ${data.reference}</p>
                <p><strong>Request Date:</strong> ${new Date(data.requestDate).toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span style="color: #ffc107; font-weight: bold;">Pending</span></p>
                ${data.accountDetails ? `<p><strong>Account Details:</strong> ${data.accountDetails}</p>` : ''}
              </div>
              
              <div class="status-pending">
                <h3>⏳ Processing Information</h3>
                <ul>
                  <li>Your withdrawal request is being reviewed</li>
                  <li>Processing typically takes 1-3 business days</li>
                  <li>You'll receive an email when processing is complete</li>
                  <li>Large amounts may require additional verification</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">Track Withdrawal</a>
              </div>
              
              <p><strong>Need Help?</strong> If you have any questions about your withdrawal, please contact our support team.</p>
            </div>
            <div class="footer">
              <p>© 2024 KLT Mines Investment Platform. All rights reserved.</p>
              <p>Reference: ${data.reference}</p>
            </div>
          </div>
        </body>
      </html>
    `
    },
    withdrawalCompleted: {
        subject: 'Withdrawal Completed - KLT Mines',
        html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Withdrawal Completed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 50%, #17a2b8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 50%, #17a2b8 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .withdrawal-details { background: #d4edda; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #28a745; }
            .amount { font-size: 2em; font-weight: bold; color: #28a745; text-align: center; margin: 20px 0; }
            .success-info { background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #17a2b8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Withdrawal Completed!</h1>
              <p>Your Funds Have Been Sent</p>
            </div>
            <div class="content">
              <h2>Great news ${data.userName}!</h2>
              <p>Your withdrawal has been processed successfully and the funds have been sent to your account.</p>
              
              <div class="amount">
                -${data.currency} ${data.amount.toLocaleString()}
              </div>
              <p style="text-align: center; font-size: 1.2em; color: #28a745;">Withdrawal Amount</p>
              
              <div class="withdrawal-details">
                <h3>📋 Withdrawal Details</h3>
                <p><strong>Amount:</strong> ${data.currency} ${data.amount.toLocaleString()}</p>
                <p><strong>Withdrawal Method:</strong> ${data.withdrawalMethod}</p>
                <p><strong>Reference:</strong> ${data.reference}</p>
                <p><strong>Completion Date:</strong> ${new Date(data.completionDate).toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Completed</span></p>
                ${data.accountDetails ? `<p><strong>Account Details:</strong> ${data.accountDetails}</p>` : ''}
                ${data.transactionHash ? `<p><strong>Transaction Hash:</strong> ${data.transactionHash}</p>` : ''}
              </div>
              
              <div class="success-info">
                <h3>🎉 What's Next?</h3>
                <ul>
                  <li>Funds should appear in your account within 1-24 hours</li>
                  <li>Check your bank account or crypto wallet for the transfer</li>
                  <li>Contact your bank/crypto provider if you don't see the funds</li>
                  <li>Keep this email for your records</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">View Transaction</a>
              </div>
              
              <p><strong>Need Help?</strong> If you have any questions about this withdrawal, please contact our support team.</p>
            </div>
            <div class="footer">
              <p>© 2024 KLT Mines Investment Platform. All rights reserved.</p>
              <p>Reference: ${data.reference}</p>
            </div>
          </div>
        </body>
      </html>
    `
    },
    depositRequest: {
        subject: 'Deposit Request Received - KLT Mines',
        html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Deposit Request Received</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #007bff 0%, #6610f2 50%, #6f42c1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #007bff 0%, #6610f2 50%, #6f42c1 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .deposit-details { background: #e3f2fd; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #007bff; }
            .amount { font-size: 2em; font-weight: bold; color: #007bff; text-align: center; margin: 20px 0; }
            .instructions { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Deposit Request Received</h1>
              <p>Complete Your Deposit</p>
            </div>
            <div class="content">
              <h2>Hello ${data.userName}!</h2>
              <p>We've received your deposit request. Please follow the instructions below to complete your deposit.</p>
              
              <div class="amount">
                +${data.currency} ${data.amount.toLocaleString()}
              </div>
              <p style="text-align: center; font-size: 1.2em; color: #007bff;">Deposit Amount</p>
              
              <div class="deposit-details">
                <h3>📋 Deposit Details</h3>
                <p><strong>Amount:</strong> ${data.currency} ${data.amount.toLocaleString()}</p>
                <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
                <p><strong>Reference:</strong> ${data.reference}</p>
                <p><strong>Request Date:</strong> ${new Date(data.requestDate).toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span style="color: #ffc107; font-weight: bold;">Pending</span></p>
                ${data.accountDetails ? `<p><strong>Account Details:</strong> ${data.accountDetails}</p>` : ''}
              </div>
              
              <div class="instructions">
                <h3>📝 Next Steps</h3>
                <ol>
                  <li>Make the payment using the provided account details</li>
                  <li>Include the reference number in your payment description</li>
                  <li>Upload proof of payment if required</li>
                  <li>Wait for confirmation (usually 1-3 hours)</li>
                </ol>
              </div>
              
              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">Track Deposit</a>
              </div>
              
              <p><strong>Important:</strong> Please ensure you include the reference number in your payment description to avoid delays.</p>
            </div>
            <div class="footer">
              <p>© 2024 KLT Mines Investment Platform. All rights reserved.</p>
              <p>Reference: ${data.reference}</p>
            </div>
          </div>
        </body>
      </html>
    `
    },
    depositConfirmed: {
        subject: 'Deposit Confirmed - KLT Mines',
        html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Deposit Confirmed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 50%, #17a2b8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 50%, #17a2b8 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .deposit-details { background: #d4edda; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #28a745; }
            .amount { font-size: 2em; font-weight: bold; color: #28a745; text-align: center; margin: 20px 0; }
            .success-info { background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #17a2b8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Deposit Confirmed!</h1>
              <p>Your Funds Are Now Available</p>
            </div>
            <div class="content">
              <h2>Great news ${data.userName}!</h2>
              <p>Your deposit has been confirmed and the funds are now available in your wallet.</p>
              
              <div class="amount">
                +${data.currency} ${data.amount.toLocaleString()}
              </div>
              <p style="text-align: center; font-size: 1.2em; color: #28a745;">Deposit Amount</p>
              
              <div class="deposit-details">
                <h3>📋 Deposit Details</h3>
                <p><strong>Amount:</strong> ${data.currency} ${data.amount.toLocaleString()}</p>
                <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
                <p><strong>Reference:</strong> ${data.reference}</p>
                <p><strong>Confirmation Date:</strong> ${new Date(data.confirmationDate).toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Confirmed</span></p>
                ${data.transactionHash ? `<p><strong>Transaction Hash:</strong> ${data.transactionHash}</p>` : ''}
              </div>
              
              <div class="success-info">
                <h3>🎉 What's Next?</h3>
                <ul>
                  <li>Your funds are now available in your wallet</li>
                  <li>You can start investing or make withdrawals</li>
                  <li>Explore our investment plans to grow your money</li>
                  <li>Track your earnings in your dashboard</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">Start Investing</a>
              </div>
              
              <p><strong>Thank you for choosing KLT Mines!</strong> We're excited to help you grow your wealth.</p>
            </div>
            <div class="footer">
              <p>© 2024 KLT Mines Investment Platform. All rights reserved.</p>
              <p>Reference: ${data.reference}</p>
            </div>
          </div>
        </body>
      </html>
    `
    }
};
//# sourceMappingURL=email-templates.js.map