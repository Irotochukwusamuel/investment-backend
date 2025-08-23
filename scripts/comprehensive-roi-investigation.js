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

const Investment = mongoose.model('Investment', investmentSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

async function comprehensiveRoiInvestigation() {
  console.log('🔍 COMPREHENSIVE ROI INVESTIGATION\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Investigation Time: ${now.toISOString()}\n`);
    
    // Get all active investments
    const activeInvestments = await Investment.find({
      status: 'active',
      endDate: { $gt: now }
    }).sort({ startDate: 1 });
    
    console.log(`📊 Found ${activeInvestments.length} active investments to investigate\n`);
    
    for (const investment of activeInvestments) {
      console.log('=' .repeat(80));
      console.log(`💰 INVESTMENT: ${investment._id}`);
      console.log('=' .repeat(80));
      
      // Basic investment details
      console.log('📋 BASIC DETAILS:');
      console.log(`   Amount: ${investment.amount.toLocaleString()} ${investment.currency}`);
      console.log(`   Daily ROI: ${investment.dailyRoi}%`);
      console.log(`   Duration: ${investment.duration} days`);
      console.log(`   Start Date: ${investment.startDate.toISOString()}`);
      console.log(`   End Date: ${investment.endDate.toISOString()}`);
      console.log(`   Status: ${investment.status}`);
      console.log('');
      
      // Time calculations
      console.log('⏰ TIME CALCULATIONS:');
      const startDate = new Date(investment.startDate);
      const endDate = new Date(investment.endDate);
      const lastRoiUpdate = investment.lastRoiUpdate ? new Date(investment.lastRoiUpdate) : startDate;
      const nextRoiUpdate = investment.nextRoiUpdate ? new Date(investment.nextRoiUpdate) : null;
      const nextRoiCycleDate = investment.nextRoiCycleDate ? new Date(investment.nextRoiCycleDate) : null;
      
      const daysElapsed = Math.max(0, Math.floor((now - startDate) / (1000 * 60 * 60 * 24)));
      const hoursElapsed = Math.max(0, Math.floor((now - startDate) / (1000 * 60 * 60)));
      const minutesElapsed = Math.max(0, Math.floor((now - startDate) / (1000 * 60)));
      
      const hoursSinceLastUpdate = Math.max(0, Math.floor((now - lastRoiUpdate) / (1000 * 60 * 60)));
      const minutesSinceLastUpdate = Math.max(0, Math.floor((now - lastRoiUpdate) / (1000 * 60)));
      
      console.log(`   Days since start: ${daysElapsed}`);
      console.log(`   Hours since start: ${hoursElapsed}`);
      console.log(`   Minutes since start: ${minutesElapsed}`);
      console.log(`   Hours since last ROI update: ${hoursSinceLastUpdate}`);
      console.log(`   Minutes since last ROI update: ${minutesSinceLastUpdate}`);
      console.log('');
      
      // ROI calculations
      console.log('📈 ROI CALCULATIONS:');
      const expectedDailyRoi = (investment.amount * investment.dailyRoi) / 100;
      const expectedHourlyRoi = expectedDailyRoi / 24;
      const expectedMinuteRoi = expectedHourlyRoi / 60;
      
      // Calculate expected total ROI based on time elapsed
      const expectedTotalRoiByDays = expectedDailyRoi * daysElapsed;
      const expectedTotalRoiByHours = expectedHourlyRoi * hoursElapsed;
      const expectedTotalRoiByMinutes = expectedMinuteRoi * minutesElapsed;
      
      // Calculate expected earned amount since last update
      const expectedEarnedAmountByHours = expectedHourlyRoi * hoursSinceLastUpdate;
      const expectedEarnedAmountByMinutes = expectedMinuteRoi * minutesSinceLastUpdate;
      
      console.log(`   Expected Daily ROI: ${expectedDailyRoi.toFixed(4)} ${investment.currency}`);
      console.log(`   Expected Hourly ROI: ${expectedHourlyRoi.toFixed(4)} ${investment.currency}`);
      console.log(`   Expected Minute ROI: ${expectedMinuteRoi.toFixed(4)} ${investment.currency}`);
      console.log('');
      
      console.log('   Expected Total ROI (by days):', expectedTotalRoiByDays.toFixed(4));
      console.log('   Expected Total ROI (by hours):', expectedTotalRoiByHours.toFixed(4));
      console.log('   Expected Total ROI (by minutes):', expectedTotalRoiByMinutes.toFixed(4));
      console.log('');
      
      console.log('   Expected Earned Amount since last update (by hours):', expectedEarnedAmountByHours.toFixed(4));
      console.log('   Expected Earned Amount since last update (by minutes):', expectedEarnedAmountByMinutes.toFixed(4));
      console.log('');
      
      // Current values
      console.log('💰 CURRENT VALUES:');
      console.log(`   Current earnedAmount: ${investment.earnedAmount || 0}`);
      console.log(`   Current totalAccumulatedRoi: ${investment.totalAccumulatedRoi || 0}`);
      console.log(`   Last ROI Update: ${lastRoiUpdate.toISOString()}`);
      console.log(`   Next ROI Update: ${nextRoiUpdate ? nextRoiUpdate.toISOString() : 'Not set'}`);
      console.log(`   Next ROI Cycle: ${nextRoiCycleDate ? nextRoiCycleDate.toISOString() : 'Not set'}`);
      console.log('');
      
      // Validation and analysis
      console.log('🔍 VALIDATION & ANALYSIS:');
      
      // Validate earnedAmount
      const earnedAmountDeviation = Math.abs((investment.earnedAmount || 0) - expectedEarnedAmountByMinutes);
      const earnedAmountDeviationPercent = expectedEarnedAmountByMinutes > 0 ? (earnedAmountDeviation / expectedEarnedAmountByMinutes) * 100 : 0;
      
      if (earnedAmountDeviation < 0.01) {
        console.log(`   ✅ earnedAmount is ACCURATE (deviation: ${earnedAmountDeviation.toFixed(4)} ${investment.currency})`);
      } else if (earnedAmountDeviation < expectedEarnedAmountByMinutes * 0.1) {
        console.log(`   ⚠️  earnedAmount is ACCEPTABLE (deviation: ${earnedAmountDeviation.toFixed(4)} ${investment.currency}, ${earnedAmountDeviationPercent.toFixed(2)}%)`);
      } else {
        console.log(`   ❌ earnedAmount is INACCURATE (deviation: ${earnedAmountDeviation.toFixed(4)} ${investment.currency}, ${earnedAmountDeviationPercent.toFixed(2)}%)`);
      }
      
      // Validate totalAccumulatedRoi
      const totalRoiDeviation = Math.abs((investment.totalAccumulatedRoi || 0) - expectedTotalRoiByMinutes);
      const totalRoiDeviationPercent = expectedTotalRoiByMinutes > 0 ? (totalRoiDeviation / expectedTotalRoiByMinutes) * 100 : 0;
      
      if (totalRoiDeviation < 0.01) {
        console.log(`   ✅ totalAccumulatedRoi is ACCURATE (deviation: ${totalRoiDeviation.toFixed(4)} ${investment.currency})`);
      } else if (totalRoiDeviation < expectedTotalRoiByMinutes * 0.1) {
        console.log(`   ⚠️  totalAccumulatedRoi is ACCEPTABLE (deviation: ${totalRoiDeviation.toFixed(4)} ${investment.currency}, ${totalRoiDeviationPercent.toFixed(2)}%)`);
      } else {
        console.log(`   ❌ totalAccumulatedRoi is INACCURATE (deviation: ${totalRoiDeviation.toFixed(4)} ${investment.currency}, ${totalRoiDeviationPercent.toFixed(2)}%)`);
      }
      console.log('');
      
      // Check transaction history
      console.log('📋 TRANSACTION HISTORY:');
      const roiTransactions = await Transaction.find({
        investmentId: investment._id,
        type: 'roi',
        status: 'completed'
      }).sort({ createdAt: -1 });
      
      if (roiTransactions.length === 0) {
        console.log('   ℹ️  No ROI transactions found');
      } else {
        console.log(`   📊 Found ${roiTransactions.length} ROI transactions:`);
        let totalTransacted = 0;
        roiTransactions.forEach((tx, idx) => {
          totalTransacted += tx.amount;
          const txDate = new Date(tx.createdAt);
          const timeAgo = Math.floor((now - txDate) / (1000 * 60 * 60));
          console.log(`      ${idx + 1}. ${tx.amount.toFixed(4)} ${tx.currency} - ${timeAgo} hours ago`);
        });
        console.log(`   💰 Total transacted: ${totalTransacted.toFixed(4)} ${investment.currency}`);
        
        // Compare with totalAccumulatedRoi
        const transactionDeviation = Math.abs(totalTransacted - (investment.totalAccumulatedRoi || 0));
        if (transactionDeviation < 0.01) {
          console.log(`   ✅ Transaction total matches totalAccumulatedRoi`);
        } else {
          console.log(`   ❌ MISMATCH: Transaction total (${totalTransacted.toFixed(4)}) ≠ totalAccumulatedRoi (${investment.totalAccumulatedRoi || 0})`);
        }
      }
      console.log('');
      
      // Recommendations
      console.log('💡 RECOMMENDATIONS:');
      
      if (earnedAmountDeviation > 0.01) {
        console.log(`   🔧 earnedAmount needs correction: current ${investment.earnedAmount || 0} → should be ${expectedEarnedAmountByMinutes.toFixed(4)}`);
      }
      
      if (totalRoiDeviation > 0.01) {
        console.log(`   🔧 totalAccumulatedRoi needs correction: current ${investment.totalAccumulatedRoi || 0} → should be ${expectedTotalRoiByMinutes.toFixed(4)}`);
      }
      
      if (!nextRoiUpdate || nextRoiUpdate <= now) {
        console.log(`   🔧 nextRoiUpdate needs updating (currently ${nextRoiUpdate ? nextRoiUpdate.toISOString() : 'Not set'})`);
      }
      
      if (!nextRoiCycleDate || nextRoiCycleDate <= now) {
        console.log(`   🔧 nextRoiCycleDate needs updating (currently ${nextRoiCycleDate ? nextRoiCycleDate.toISOString() : 'Not set'})`);
      }
      
      console.log('');
      console.log('');
    }
    
    console.log('🎯 COMPREHENSIVE INVESTIGATION COMPLETED!');
    
  } catch (error) {
    console.error('❌ Error in comprehensive investigation:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await comprehensiveRoiInvestigation();
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

module.exports = { comprehensiveRoiInvestigation };
