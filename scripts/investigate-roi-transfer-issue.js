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
  processedAt: Date,
  description: String
});

const Investment = mongoose.model('Investment', investmentSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

async function investigateRoiTransferIssue() {
  console.log('🔍 INVESTIGATING ROI TRANSFER ISSUE\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Current Time: ${now.toISOString()}\n`);
    
    // Get all active investments
    const activeInvestments = await Investment.find({
      status: 'active',
      endDate: { $gt: now }
    }).sort({ startDate: 1 });
    
    console.log(`📊 Found ${activeInvestments.length} active investments to investigate\n`);
    
    for (const investment of activeInvestments) {
      console.log('=' .repeat(60));
      console.log(`💰 INVESTMENT: ${investment._id}`);
      console.log('=' .repeat(60));
      
      const startDate = new Date(investment.startDate);
      const lastRoiUpdate = investment.lastRoiUpdate ? new Date(investment.lastRoiUpdate) : startDate;
      const nextRoiCycleDate = investment.nextRoiCycleDate ? new Date(investment.nextRoiCycleDate) : null;
      
      // Calculate time differences
      const timeSinceStart = now.getTime() - startDate.getTime();
      const timeSinceLastUpdate = now.getTime() - lastRoiUpdate.getTime();
      const timeUntilNextCycle = nextRoiCycleDate ? nextRoiCycleDate.getTime() - now.getTime() : 0;
      
      const daysSinceStart = Math.floor(timeSinceStart / (1000 * 60 * 60 * 24));
      const hoursSinceStart = Math.floor(timeSinceStart / (1000 * 60 * 60));
      const hoursSinceLastUpdate = Math.floor(timeSinceLastUpdate / (1000 * 60 * 60));
      const hoursUntilNextCycle = Math.floor(timeUntilNextCycle / (1000 * 60 * 60));
      
      console.log('📊 CURRENT STATE:');
      console.log(`   earnedAmount: ${investment.earnedAmount || 0}`);
      console.log(`   totalAccumulatedRoi: ${investment.totalAccumulatedRoi || 0}`);
      console.log(`   lastRoiUpdate: ${lastRoiUpdate.toISOString()}`);
      console.log(`   nextRoiCycleDate: ${nextRoiCycleDate ? nextRoiCycleDate.toISOString() : 'Not set'}`);
      console.log('');
      
      console.log('⏰ TIME ANALYSIS:');
      console.log(`   Days since start: ${daysSinceStart}`);
      console.log(`   Hours since start: ${hoursSinceStart}`);
      console.log(`   Hours since last update: ${hoursSinceLastUpdate}`);
      console.log(`   Hours until next cycle: ${hoursUntilNextCycle}`);
      console.log('');
      
      // Calculate expected values
      const expectedDailyRoi = (investment.amount * investment.dailyRoi) / 100;
      const expectedHourlyRoi = expectedDailyRoi / 24;
      const expectedTotalRoi = expectedDailyRoi * daysSinceStart;
      
      console.log('📈 EXPECTED VALUES:');
      console.log(`   Expected Daily ROI: ${expectedDailyRoi.toFixed(4)} ${investment.currency}`);
      console.log(`   Expected Hourly ROI: ${expectedHourlyRoi.toFixed(4)} ${investment.currency}`);
      console.log(`   Expected Total ROI (${daysSinceStart} days): ${expectedTotalRoi.toFixed(4)} ${investment.currency}`);
      console.log('');
      
      // Check for discrepancies
      const totalRoiDeviation = Math.abs((investment.totalAccumulatedRoi || 0) - expectedTotalRoi);
      const hourlyDeviation = totalRoiDeviation / expectedHourlyRoi;
      
      console.log('🔍 DISCREPANCY ANALYSIS:');
      console.log(`   Total ROI deviation: ${totalRoiDeviation.toFixed(4)} ${investment.currency}`);
      console.log(`   This represents: ${hourlyDeviation.toFixed(2)} hours of missing ROI`);
      console.log('');
      
      if (totalRoiDeviation > 0.01) {
        console.log('⚠️  ISSUE DETECTED:');
        console.log(`   Expected: ${expectedTotalRoi.toFixed(4)} ${investment.currency}`);
        console.log(`   Actual: ${investment.totalAccumulatedRoi || 0} ${investment.currency}`);
        console.log(`   Missing: ${totalRoiDeviation.toFixed(4)} ${investment.currency}`);
        console.log(`   This suggests the cycle was processed ${hourlyDeviation.toFixed(2)} hours early`);
      }
      
      console.log('');
    }
    
    // Check for recent ROI transactions
    console.log('🔍 CHECKING RECENT ROI TRANSACTIONS:\n');
    
    const recentRoiTransactions = await Transaction.find({
      type: 'roi',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).sort({ createdAt: -1 });
    
    if (recentRoiTransactions.length === 0) {
      console.log('❌ NO ROI TRANSACTIONS FOUND IN LAST 24 HOURS');
      console.log('   This confirms the ROI transfer failed!');
    } else {
      console.log(`📊 Found ${recentRoiTransactions.length} ROI transactions in last 24 hours:`);
      
      for (const tx of recentRoiTransactions) {
        const txDate = new Date(tx.createdAt);
        const timeAgo = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60));
        console.log(`   ${tx.amount.toFixed(4)} ${tx.currency} - ${timeAgo} hours ago - ${tx.status} - ${tx.description || 'No description'}`);
      }
    }
    
    console.log('');
    
  } catch (error) {
    console.error('❌ Error investigating ROI transfer issue:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await investigateRoiTransferIssue();
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

module.exports = { investigateRoiTransferIssue };
