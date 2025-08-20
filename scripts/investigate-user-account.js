const { MongoClient } = require('mongodb');
require('dotenv').config();

async function investigateUserAccount(email) {
  let client;
  
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/investment';
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db();
    
    console.log(`🔍 Investigating account: ${email}`);
    console.log('=' .repeat(60));

    // Find user
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`👤 User Details:`);
    console.log(`   ID: ${user._id}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Phone: ${user.phoneNumber || 'N/A'}`);
    console.log(`   Status: ${user.isActive ? 'Active' : 'Inactive'}`);
    console.log(`   Email Verified: ${user.isEmailVerified ? 'Yes' : 'No'}`);
    console.log(`   Phone Verified: ${user.isPhoneVerified ? 'Yes' : 'No'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Referral Code: ${user.referralCode || 'N/A'}`);
    console.log(`   Referred By: ${user.referredBy || 'None'}`);
    console.log(`   Created At: ${user.createdAt}`);
    console.log('');

    // Get user's wallets
    const wallets = await db.collection('wallets').find({ userId: user._id }).toArray();
    console.log(`💰 Wallet Balances:`);
    if (wallets.length === 0) {
      console.log('   No wallets found');
    } else {
      wallets.forEach(wallet => {
        const type = wallet.type || 'unknown';
        const balance = wallet.balance || 0;
        const currency = wallet.currency || 'usd';
        console.log(`   ${type.toUpperCase()}: ${balance} ${currency.toUpperCase()}`);
      });
    }
    console.log('');

    // Get user's investments
    const investments = await db.collection('investments').find({ userId: user._id }).toArray();
    console.log(`📈 Investment Details:`);
    console.log(`   Total Investments: ${investments.length}`);
    
    let totalInvested = 0;
    let totalExpectedReturn = 0;
    let totalAccumulatedRoi = 0;
    let totalDailyRoiEarnings = 0;

    for (const investment of investments) {
      // Get investment plan details
      const plan = await db.collection('investmentplans').findOne({ _id: investment.planId });
      
      console.log(`\n   Investment ${investments.indexOf(investment) + 1}:`);
      console.log(`     ID: ${investment._id}`);
      console.log(`     Plan: ${plan?.name || 'N/A'}`);
      console.log(`     Amount: ${investment.amount} ${investment.currency.toUpperCase()}`);
      console.log(`     Status: ${investment.status}`);
      console.log(`     Start Date: ${investment.startDate}`);
      console.log(`     End Date: ${investment.endDate}`);
      console.log(`     Duration: ${plan?.duration || 'N/A'} days`);
      console.log(`     Total ROI: ${plan?.totalRoi || 'N/A'}%`);
      console.log(`     Daily ROI: ${plan?.dailyRoi || 'N/A'}%`);
      console.log(`     Expected Return: ${investment.expectedReturn} ${investment.currency.toUpperCase()}`);
      console.log(`     Accumulated ROI: ${investment.accumulatedRoi || 0} ${investment.currency.toUpperCase()}`);
      console.log(`     Daily ROI Earnings: ${investment.dailyRoiEarnings || 0} ${investment.currency.toUpperCase()}`);
      console.log(`     Next ROI Update: ${investment.nextRoiUpdate || 'N/A'}`);
      console.log(`     Last ROI Update: ${investment.lastRoiUpdate || 'Never'}`);
      console.log(`     ROI Countdown: ${investment.roiCountdown || 'N/A'}`);
      console.log(`     Independent Countdown: ${investment.independentCountdown || 'N/A'}`);

      totalInvested += investment.amount;
      totalExpectedReturn += investment.expectedReturn;
      totalAccumulatedRoi += (investment.accumulatedRoi || 0);
      totalDailyRoiEarnings += (investment.dailyRoiEarnings || 0);
    }

    console.log(`\n   📊 Investment Summary:`);
    console.log(`     Total Invested: ${totalInvested}`);
    console.log(`     Total Expected Return: ${totalExpectedReturn}`);
    console.log(`     Total Accumulated ROI: ${totalAccumulatedRoi}`);
    console.log(`     Total Daily ROI Earnings: ${totalDailyRoiEarnings}`);
    console.log('');

    // Get user's transactions
    const transactions = await db.collection('transactions').find({ userId: user._id }).sort({ createdAt: -1 }).toArray();
    console.log(`💳 Transaction History:`);
    console.log(`   Total Transactions: ${transactions.length}`);
    
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalBonuses = 0;
    let totalRoiPayments = 0;

    transactions.forEach((transaction, index) => {
      if (index < 10) { // Show only first 10 transactions
        console.log(`\n   Transaction ${index + 1}:`);
        console.log(`     ID: ${transaction._id}`);
        console.log(`     Type: ${transaction.type}`);
        console.log(`     Amount: ${transaction.amount} ${transaction.currency.toUpperCase()}`);
        console.log(`     Status: ${transaction.status}`);
        console.log(`     Description: ${transaction.description || 'N/A'}`);
        console.log(`     Created At: ${transaction.createdAt}`);
      }

      // Calculate totals
      if (transaction.type === 'deposit') totalDeposits += transaction.amount;
      else if (transaction.type === 'withdrawal') totalWithdrawals += transaction.amount;
      else if (transaction.type === 'bonus') totalBonuses += transaction.amount;
      else if (transaction.type === 'roi') totalRoiPayments += transaction.amount;
    });

    if (transactions.length > 10) {
      console.log(`   ... and ${transactions.length - 10} more transactions`);
    }

    console.log(`\n   📊 Transaction Summary:`);
    console.log(`     Total Deposits: ${totalDeposits}`);
    console.log(`     Total Withdrawals: ${totalWithdrawals}`);
    console.log(`     Total Bonuses: ${totalBonuses}`);
    console.log(`     Total ROI Payments: ${totalRoiPayments}`);
    console.log('');

    // Get user's referrals
    const referrals = await db.collection('referrals').find({ referrerId: user._id }).toArray();
    console.log(`👥 Referral Details:`);
    console.log(`   Total Referrals: ${referrals.length}`);
    console.log(`   Referral Earnings: ${user.totalReferralEarnings || 0}`);
    console.log(`   Welcome Bonus Given: ${user.welcomeBonusGiven ? 'Yes' : 'No'}`);
    console.log(`   First Bonus Received At: ${user.firstBonusReceivedAt || 'Never'}`);
    
    if (referrals.length > 0) {
      console.log(`\n   Referred Users:`);
      referrals.forEach((referral, index) => {
        console.log(`     ${index + 1}. ${referral.referredUserEmail} - Status: ${referral.status}`);
      });
    }
    console.log('');

    // Get user's withdrawals
    const withdrawals = await db.collection('withdrawals').find({ userId: user._id }).toArray();
    console.log(`💸 Withdrawal Details:`);
    console.log(`   Total Withdrawals: ${withdrawals.length}`);
    
    let totalWithdrawalAmount = 0;
    let totalWithdrawalFee = 0;
    
    withdrawals.forEach((withdrawal, index) => {
      console.log(`\n   Withdrawal ${index + 1}:`);
      console.log(`     ID: ${withdrawal._id}`);
      console.log(`     Amount: ${withdrawal.amount} ${withdrawal.currency.toUpperCase()}`);
      console.log(`     Fee: ${withdrawal.fee || 0} ${withdrawal.currency.toUpperCase()}`);
      console.log(`     Status: ${withdrawal.status}`);
      console.log(`     Created At: ${withdrawal.createdAt}`);
      console.log(`     Processed At: ${withdrawal.processedAt || 'Pending'}`);

      totalWithdrawalAmount += withdrawal.amount;
      totalWithdrawalFee += (withdrawal.fee || 0);
    });

    console.log(`\n   📊 Withdrawal Summary:`);
    console.log(`     Total Withdrawal Amount: ${totalWithdrawalAmount}`);
    console.log(`     Total Withdrawal Fee: ${totalWithdrawalFee}`);
    console.log('');

    // Deep ROI Calculation Analysis
    console.log(`🔬 Deep ROI Calculation Analysis:`);
    console.log(`   Current Time: ${new Date()}`);
    
    for (const investment of investments) {
      if (investment.status === 'active') {
        const plan = await db.collection('investmentplans').findOne({ _id: investment.planId });
        const index = investments.indexOf(investment);
        
        console.log(`\n   Investment ${index + 1} ROI Analysis:`);
        
        const now = new Date();
        const startDate = new Date(investment.startDate);
        const endDate = new Date(investment.endDate);
        const daysElapsed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
        const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        console.log(`     Days Elapsed: ${daysElapsed}/${totalDays}`);
        console.log(`     Investment Amount: ${investment.amount}`);
        console.log(`     Daily ROI Rate: ${plan?.dailyRoi || 'N/A'}%`);
        
        // Calculate expected accumulated ROI
        const expectedDailyRoi = (investment.amount * (plan?.dailyRoi || 0)) / 100;
        const expectedAccumulatedRoi = expectedDailyRoi * daysElapsed;
        
        console.log(`     Expected Daily ROI: ${expectedDailyRoi}`);
        console.log(`     Expected Accumulated ROI: ${expectedAccumulatedRoi}`);
        console.log(`     Actual Accumulated ROI: ${investment.accumulatedRoi || 0}`);
        console.log(`     Difference: ${(investment.accumulatedRoi || 0) - expectedAccumulatedRoi}`);
        
        // Check if ROI countdown is working
        if (investment.independentCountdown) {
          const countdownDate = new Date(investment.independentCountdown);
          const timeUntilNextRoi = countdownDate - now;
          const hoursUntilNextRoi = Math.floor(timeUntilNextRoi / (1000 * 60 * 60));
          const minutesUntilNextRoi = Math.floor((timeUntilNextRoi % (1000 * 60 * 60)) / (1000 * 60));
          
          console.log(`     Next ROI in: ${hoursUntilNextRoi}h ${minutesUntilNextRoi}m`);
        }
      }
    }

    // Bonus Analysis
    console.log(`\n🎁 Bonus Analysis:`);
    console.log(`   Welcome Bonus: ${user.welcomeBonusGiven ? 'Given' : 'Not Given'}`);
    console.log(`   Referral Bonus: ${user.totalReferralEarnings || 0}`);
    console.log(`   Total Bonuses Received: ${totalBonuses}`);
    
    // Check if user can withdraw bonus
    if (user.firstBonusReceivedAt) {
      const bonusWaitTime = 15 * 60 * 1000; // 15 minutes in milliseconds
      const timeSinceFirstBonus = Date.now() - new Date(user.firstBonusReceivedAt).getTime();
      const canWithdrawBonus = timeSinceFirstBonus >= bonusWaitTime;
      
      console.log(`   First Bonus Received: ${user.firstBonusReceivedAt}`);
      console.log(`   Time Since First Bonus: ${Math.floor(timeSinceFirstBonus / (1000 * 60))} minutes`);
      console.log(`   Can Withdraw Bonus: ${canWithdrawBonus ? 'Yes' : 'No'}`);
    }

    // Wallet Balance Verification
    console.log(`\n🔍 Wallet Balance Verification:`);
    let calculatedTotalBalance = 0;
    
    if (wallets.length > 0) {
      wallets.forEach(wallet => {
        const type = wallet.type || 'unknown';
        const balance = wallet.balance || 0;
        const currency = wallet.currency || 'usd';
        console.log(`   ${type.toUpperCase()} Wallet: ${balance} ${currency.toUpperCase()}`);
        calculatedTotalBalance += balance;
      });
      
      console.log(`   Calculated Total Balance: ${calculatedTotalBalance}`);
      
      // Check if wallet balances match expected values
      const expectedBalance = totalDeposits + totalBonuses + totalRoiPayments - totalWithdrawals;
      console.log(`   Expected Total Balance: ${expectedBalance}`);
      console.log(`   Balance Difference: ${calculatedTotalBalance - expectedBalance}`);
    } else {
      console.log('   No wallets to verify');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Investigation Complete');

  } catch (error) {
    console.error('❌ Error during investigation:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the investigation
const email = 'jameszalez258@gmail.com';
investigateUserAccount(email);