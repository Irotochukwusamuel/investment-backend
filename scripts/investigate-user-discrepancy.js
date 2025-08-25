const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/investment';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log(`   Database: ${mongoose.connection.db.databaseName}`);
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

// User Schema
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String
});

const Investment = mongoose.model('Investment', investmentSchema);
const User = mongoose.model('User', userSchema);

async function investigateUserDiscrepancy() {
  console.log('🔍 INVESTIGATING USER DISCREPANCY\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Current Time: ${now.toISOString()}\n`);
    
    // Find the two investments with ₦50,000 and 6.7% ROI
    const targetInvestments = await Investment.find({
      amount: 50000,
      dailyRoi: 6.7,
      status: 'active'
    }).populate('userId', 'firstName lastName email');
    
    console.log(`📊 Found ${targetInvestments.length} investments with ₦50,000 and 6.7% ROI\n`);
    
    if (targetInvestments.length < 2) {
      console.log('❌ Need at least 2 investments to compare');
      return;
    }
    
    // Sort by start date to see the timeline
    targetInvestments.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    for (let i = 0; i < targetInvestments.length; i++) {
      const investment = targetInvestments[i];
      const user = investment.userId;
      
      console.log('=' .repeat(60));
      console.log(`💰 INVESTMENT ${i + 1}: ${user.firstName} ${user.lastName}`);
      console.log('=' .repeat(60));
      
      const startDate = new Date(investment.startDate);
      const lastRoiUpdate = investment.lastRoiUpdate ? new Date(investment.lastRoiUpdate) : startDate;
      const nextRoiCycleDate = investment.nextRoiCycleDate ? new Date(investment.nextRoiCycleDate) : null;
      const nextRoiUpdate = investment.nextRoiUpdate ? new Date(investment.nextRoiUpdate) : null;
      
      // Calculate expected values
      const expectedDailyRoi = (investment.amount * investment.dailyRoi) / 100; // ₦3,350
      const expectedHourlyRoi = expectedDailyRoi / 24; // ₦139.5833 per hour
      
      // Calculate time differences
      const timeSinceStart = now.getTime() - startDate.getTime();
      const timeSinceLastUpdate = now.getTime() - lastRoiUpdate.getTime();
      const timeUntilNextCycle = nextRoiCycleDate ? nextRoiCycleDate.getTime() - now.getTime() : 0;
      
      const daysSinceStart = Math.floor(timeSinceStart / (1000 * 60 * 60 * 24));
      const hoursSinceStart = Math.floor(timeSinceStart / (1000 * 60 * 60));
      const hoursSinceLastUpdate = Math.floor(timeSinceLastUpdate / (1000 * 60 * 60));
      const hoursUntilNextCycle = Math.floor(timeUntilNextCycle / (1000 * 60 * 60));
      
      console.log('👤 USER DETAILS:');
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Investment ID: ${investment._id}`);
      console.log('');
      
      console.log('📊 INVESTMENT DETAILS:');
      console.log(`   Amount: ₦${investment.amount.toLocaleString()}`);
      console.log(`   Daily ROI: ${investment.dailyRoi}%`);
      console.log(`   Expected Daily ROI: ₦${expectedDailyRoi.toLocaleString()}`);
      console.log(`   Expected Hourly ROI: ₦${expectedHourlyRoi.toFixed(4)}`);
      console.log('');
      
      console.log('💰 CURRENT STATE:');
      console.log(`   earnedAmount: ₦${investment.earnedAmount || 0}`);
      console.log(`   totalAccumulatedRoi: ₦${investment.totalAccumulatedRoi || 0}`);
      console.log(`   Expected Total ROI: ₦${expectedDailyRoi.toLocaleString()}`);
      console.log('');
      
      console.log('⏰ TIMING ANALYSIS:');
      console.log(`   Start Date: ${startDate.toISOString()}`);
      console.log(`   Last ROI Update: ${lastRoiUpdate.toISOString()}`);
      console.log(`   Next ROI Cycle: ${nextRoiCycleDate ? nextRoiCycleDate.toISOString() : 'Not set'}`);
      console.log(`   Next Hourly Update: ${nextRoiUpdate ? nextRoiUpdate.toISOString() : 'Not set'}`);
      console.log('');
      
      console.log('📈 TIME CALCULATIONS:');
      console.log(`   Days since start: ${daysSinceStart}`);
      console.log(`   Hours since start: ${hoursSinceStart}`);
      console.log(`   Hours since last update: ${hoursSinceLastUpdate}`);
      console.log(`   Hours until next cycle: ${hoursUntilNextCycle}`);
      console.log('');
      
      // Calculate what the total should be
      const expectedTotalForTime = expectedDailyRoi * daysSinceStart;
      const actualTotal = investment.totalAccumulatedRoi || 0;
      const discrepancy = expectedTotalForTime - actualTotal;
      const missingHours = discrepancy / expectedHourlyRoi;
      
      console.log('🔍 DISCREPANCY ANALYSIS:');
      console.log(`   Expected total for ${daysSinceStart} days: ₦${expectedTotalForTime.toFixed(4)}`);
      console.log(`   Actual total: ₦${actualTotal.toFixed(4)}`);
      console.log(`   Discrepancy: ₦${discrepancy.toFixed(4)}`);
      console.log(`   This represents: ${missingHours.toFixed(2)} hours of missing ROI`);
      console.log('');
      
      if (discrepancy > 0.01) {
        console.log('⚠️  ISSUE DETECTED:');
        console.log(`   This investment is missing ₦${discrepancy.toFixed(4)} in ROI`);
        console.log(`   This suggests the 24-hour cycle was processed ${missingHours.toFixed(2)} hours early`);
      }
      
      console.log('');
    }
    
    // Compare the two investments
    console.log('🎯 COMPARISON ANALYSIS:\n');
    
    const investment1 = targetInvestments[0];
    const investment2 = targetInvestments[1];
    
    const total1 = investment1.totalAccumulatedRoi || 0;
    const total2 = investment2.totalAccumulatedRoi || 0;
    const difference = Math.abs(total1 - total2);
    
    console.log(`📊 COMPARISON RESULTS:`);
    console.log(`   ${investment1.userId.firstName} ${investment1.userId.lastName}: ₦${total1.toFixed(4)}`);
    console.log(`   ${investment2.userId.firstName} ${investment2.userId.lastName}: ₦${total2.toFixed(4)}`);
    console.log(`   Difference: ₦${difference.toFixed(4)}`);
    console.log('');
    
    // Check for ROI transactions
    console.log('🔍 CHECKING ROI TRANSACTIONS:\n');
    
    const db = mongoose.connection.db;
    const transactionsCollection = db.collection('transactions');
    
    for (const investment of targetInvestments) {
      const user = investment.userId;
      console.log(`📋 ROI Transactions for ${user.firstName} ${user.lastName} (${investment._id}):`);
      
      const roiTransactions = await transactionsCollection.find({
        investmentId: investment._id,
        type: 'roi',
        status: 'success'
      }).sort({ createdAt: -1 }).limit(5).toArray();
      
      if (roiTransactions.length === 0) {
        console.log(`   ❌ NO ROI TRANSACTIONS FOUND`);
      } else {
        console.log(`   📊 Found ${roiTransactions.length} ROI transactions:`);
        
        for (const tx of roiTransactions) {
          const txDate = new Date(tx.createdAt);
          const timeAgo = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
          console.log(`      ${tx.amount.toFixed(4)} ${tx.currency} - ${timeAgo} days ago - ${tx.description || 'No description'}`);
        }
      }
      console.log('');
    }
    
    console.log('=' .repeat(80));
    
  } catch (error) {
    console.error('❌ Error investigating user discrepancy:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await investigateUserDiscrepancy();
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

module.exports = { investigateUserDiscrepancy };
