const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/investment';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
}

// Investment Schema
const investmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'InvestmentPlan' },
  amount: Number,
  currency: String,
  dailyRoi: Number,
  totalRoi: Number,
  duration: Number,
  startDate: Date,
  endDate: Date,
  status: String,
  earnedAmount: { type: Number, default: 0 },
  totalAccumulatedRoi: { type: Number, default: 0 },
  expectedReturn: Number,
  lastRoiUpdate: Date,
  nextRoiCycleDate: Date,
  nextRoiUpdate: Date,
  welcomeBonus: { type: Number, default: 0 },
  referralBonus: { type: Number, default: 0 }
});

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  investmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment' },
  type: String,
  amount: Number,
  currency: String,
  status: String,
  createdAt: Date,
  processedAt: Date
});

// User Schema
const userSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String
});

const Investment = mongoose.model('Investment', investmentSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const User = mongoose.model('User', userSchema);

async function investigateInvestment(investmentId) {
  console.log(`🔍 Investigating investment: ${investmentId}\n`);
  
  try {
    // Get the specific investment
    const investment = await Investment.findById(investmentId);
    if (!investment) {
      console.log('❌ Investment not found');
      return;
    }

    console.log('📊 Investment Details:');
    console.log(`   ID: ${investment._id}`);
    console.log(`   Status: ${investment.status}`);
    console.log(`   Amount: ${investment.amount} ${investment.currency}`);
    console.log(`   Daily ROI: ${investment.dailyRoi}%`);
    console.log(`   Duration: ${investment.duration} days`);
    console.log(`   Start Date: ${investment.startDate.toISOString()}`);
    console.log(`   End Date: ${investment.endDate.toISOString()}`);
    console.log(`   Earned Amount: ${investment.earnedAmount || 0}`);
    console.log(`   Total Accumulated ROI: ${investment.totalAccumulatedRoi || 0}`);
    console.log(`   Expected Return: ${investment.expectedReturn || 0}`);
    console.log(`   Welcome Bonus: ${investment.welcomeBonus || 0}`);
    console.log(`   Referral Bonus: ${investment.referralBonus || 0}`);
    console.log('');

    // Get user details
    const user = await User.findById(investment.userId);
    if (user) {
      console.log('👤 User Details:');
      console.log(`   ID: ${user._id}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log('');
    }

    // Check countdown fields
    console.log('⏰ Countdown Analysis:');
    const now = new Date();
    const startDate = new Date(investment.startDate);
    const endDate = new Date(investment.endDate);
    const lastRoiUpdate = investment.lastRoiUpdate ? new Date(investment.lastRoiUpdate) : null;
    const nextRoiUpdate = investment.nextRoiUpdate ? new Date(investment.nextRoiUpdate) : null;
    const nextRoiCycleDate = investment.nextRoiCycleDate ? new Date(investment.nextRoiCycleDate) : null;

    console.log(`   Current Time: ${now.toISOString()}`);
    console.log(`   Start Date: ${startDate.toISOString()}`);
    console.log(`   End Date: ${endDate.toISOString()}`);
    console.log(`   Last ROI Update: ${lastRoiUpdate ? lastRoiUpdate.toISOString() : 'Not set'}`);
    console.log(`   Next ROI Update: ${nextRoiUpdate ? nextRoiUpdate.toISOString() : 'Not set'}`);
    console.log(`   Next ROI Cycle: ${nextRoiCycleDate ? nextRoiCycleDate.toISOString() : 'Not set'}`);
    console.log('');

    // Calculate expected values
    const daysElapsed = Math.max(0, Math.floor((now - startDate) / (1000 * 60 * 60 * 24)));
    const expectedDailyRoi = (investment.amount * investment.dailyRoi) / 100;
    const expectedTotalRoi = expectedDailyRoi * daysElapsed;
    const expectedHourlyRoi = expectedDailyRoi / 24;

    console.log('📈 Expected Values:');
    console.log(`   Days Elapsed: ${daysElapsed}`);
    console.log(`   Expected Daily ROI: ${expectedDailyRoi.toFixed(4)} ${investment.currency}`);
    console.log(`   Expected Total ROI so far: ${expectedTotalRoi.toFixed(4)} ${investment.currency}`);
    console.log(`   Expected Hourly ROI: ${expectedHourlyRoi.toFixed(4)} ${investment.currency}`);
    console.log('');

    // Check countdown validity
    console.log('🔍 Countdown Issues:');
    if (!nextRoiUpdate) {
      console.log('   ❌ nextRoiUpdate is not set');
    } else if (nextRoiUpdate <= now) {
      console.log(`   ❌ nextRoiUpdate is in the past: ${nextRoiUpdate.toISOString()}`);
    } else {
      const timeToNext = nextRoiUpdate.getTime() - now.getTime();
      const minutesToNext = Math.floor(timeToNext / (1000 * 60));
      console.log(`   ✅ nextRoiUpdate is valid: ${minutesToNext} minutes from now`);
    }

    if (!nextRoiCycleDate) {
      console.log('   ❌ nextRoiCycleDate is not set');
    } else if (nextRoiCycleDate <= now) {
      console.log(`   ❌ nextRoiCycleDate is in the past: ${nextRoiCycleDate.toISOString()}`);
    } else {
      const timeToCycle = nextRoiCycleDate.getTime() - now.getTime();
      const hoursToCycle = Math.floor(timeToCycle / (1000 * 60 * 60));
      console.log(`   ✅ nextRoiCycleDate is valid: ${hoursToCycle} hours from now`);
    }

    if (!lastRoiUpdate) {
      console.log('   ❌ lastRoiUpdate is not set');
    } else {
      const timeSinceLast = now.getTime() - lastRoiUpdate.getTime();
      const hoursSinceLast = Math.floor(timeSinceLast / (1000 * 60 * 60));
      console.log(`   ✅ lastRoiUpdate: ${hoursSinceLast} hours ago`);
    }
    console.log('');

    // Check ROI amount issues
    console.log('💰 ROI Amount Issues:');
    if (investment.earnedAmount === 0 && daysElapsed > 0) {
      console.log('   ❌ earnedAmount is 0 but investment has been running for days');
    } else if (investment.earnedAmount > expectedTotalRoi * 1.1) {
      console.log(`   ⚠️  earnedAmount (${investment.earnedAmount}) is higher than expected (${expectedTotalRoi.toFixed(4)})`);
    } else if (investment.earnedAmount < expectedTotalRoi * 0.9 && daysElapsed > 1) {
      console.log(`   ⚠️  earnedAmount (${investment.earnedAmount}) is lower than expected (${expectedTotalRoi.toFixed(4)})`);
    } else {
      console.log(`   ✅ earnedAmount (${investment.earnedAmount}) is within expected range`);
    }

    if (investment.totalAccumulatedRoi === 0 && daysElapsed > 0) {
      console.log('   ❌ totalAccumulatedRoi is 0 but investment has been running for days');
    } else {
      console.log(`   ✅ totalAccumulatedRoi: ${investment.totalAccumulatedRoi}`);
    }
    console.log('');

    // Check transaction history
    console.log('📋 Transaction History:');
    const transactions = await Transaction.find({
      investmentId: investment._id,
      type: 'roi'
    }).sort({ createdAt: -1 });

    if (transactions.length === 0) {
      console.log('   ℹ️  No ROI transactions found');
    } else {
      console.log(`   📊 Found ${transactions.length} ROI transactions:`);
      transactions.forEach((tx, idx) => {
        const txDate = new Date(tx.createdAt);
        const timeAgo = Math.floor((now - txDate) / (1000 * 60 * 60));
        console.log(`      ${idx + 1}. ${tx.amount} ${tx.currency} - ${timeAgo} hours ago - Status: ${tx.status}`);
      });
    }
    console.log('');

    // Check if investment should be processed
    console.log('⚙️  Processing Status:');
    const shouldProcessHourly = nextRoiUpdate && nextRoiUpdate <= now;
    const shouldProcessDaily = nextRoiCycleDate && nextRoiCycleDate <= now;
    const isActive = investment.status === 'active';
    const hasNotEnded = endDate > now;

    console.log(`   Investment Active: ${isActive ? '✅ Yes' : '❌ No'}`);
    console.log(`   Investment Not Ended: ${hasNotEnded ? '✅ Yes' : '❌ No'}`);
    console.log(`   Should Process Hourly: ${shouldProcessHourly ? '✅ Yes' : '❌ No'}`);
    console.log(`   Should Process Daily: ${shouldProcessDaily ? '✅ Yes' : '❌ No'}`);
    console.log('');

    // Recommendations
    console.log('💡 Recommendations:');
    if (shouldProcessHourly) {
      console.log('   🔧 Investment needs hourly ROI processing');
    }
    if (shouldProcessDaily) {
      console.log('   🔧 Investment needs daily ROI cycle processing');
    }
    if (!nextRoiUpdate || nextRoiUpdate <= now) {
      console.log('   🔧 Countdown needs to be updated');
    }
    if (investment.earnedAmount === 0 && daysElapsed > 0) {
      console.log('   🔧 ROI amounts need to be calculated and updated');
    }

  } catch (error) {
    console.error('❌ Error investigating investment:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await investigateInvestment('68a7038f46584963a14a6b03');
  } catch (error) {
    console.error('❌ Main error:', error);
  } finally {
    await disconnectDB();
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { investigateInvestment };
