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

const Investment = mongoose.model('Investment', investmentSchema);

async function testCronJobs() {
  console.log('🧪 Testing Cron Job Functionality\n');
  
  try {
    const now = new Date();
    console.log(`Current Time: ${now.toISOString()}\n`);
    
    // Test 1: Check investments that should be processed hourly
    console.log('📊 Test 1: Hourly ROI Processing');
    const investmentsForHourly = await Investment.find({
      status: 'active',
      endDate: { $gt: now },
      nextRoiUpdate: { $lte: now }
    });
    
    console.log(`   Investments needing hourly processing: ${investmentsForHourly.length}`);
    investmentsForHourly.forEach(inv => {
      const timePast = Math.floor((now - new Date(inv.nextRoiUpdate)) / (1000 * 60));
      console.log(`      - ${inv._id}: ${timePast} minutes past due`);
    });
    console.log('');
    
    // Test 2: Check investments that should be processed daily
    console.log('📊 Test 2: Daily ROI Cycle Processing');
    const investmentsForDaily = await Investment.find({
      status: 'active',
      endDate: { $gt: now },
      nextRoiCycleDate: { $lte: now }
    });
    
    console.log(`   Investments needing daily processing: ${investmentsForDaily.length}`);
    investmentsForDaily.forEach(inv => {
      const timePast = Math.floor((now - new Date(inv.nextRoiCycleDate)) / (1000 * 60 * 60));
      console.log(`      - ${inv._id}: ${timePast} hours past due`);
    });
    console.log('');
    
    // Test 3: Check countdown synchronization
    console.log('📊 Test 3: Countdown Synchronization');
    const activeInvestments = await Investment.find({
      status: 'active',
      endDate: { $gt: now }
    });
    
    let countdownIssues = 0;
    activeInvestments.forEach(inv => {
      const nextRoiUpdate = new Date(inv.nextRoiUpdate);
      const nextRoiCycleDate = new Date(inv.nextRoiCycleDate);
      const lastRoiUpdate = new Date(inv.lastRoiUpdate);
      
      if (nextRoiUpdate <= now) {
        countdownIssues++;
        const timePast = Math.floor((now - nextRoiUpdate) / (1000 * 60));
        console.log(`      ❌ ${inv._id}: nextRoiUpdate ${timePast} minutes past due`);
      }
      
      if (nextRoiCycleDate <= now) {
        countdownIssues++;
        const timePast = Math.floor((now - nextRoiCycleDate) / (1000 * 60 * 60));
        console.log(`      ❌ ${inv._id}: nextRoiCycleDate ${timePast} hours past due`);
      }
    });
    
    if (countdownIssues === 0) {
      console.log('   ✅ All countdowns are properly synchronized');
    } else {
      console.log(`   ⚠️  Found ${countdownIssues} countdown issues`);
    }
    console.log('');
    
    // Test 4: Simulate what the cron jobs should do
    console.log('📊 Test 4: Simulating Cron Job Actions');
    
    // Simulate hourly ROI accumulation
    console.log('   Simulating hourly ROI accumulation...');
    for (const investment of activeInvestments) {
      const dailyRoiAmount = (investment.amount * investment.dailyRoi) / 100;
      const hourlyRoiAmount = dailyRoiAmount / 24;
      const currentEarnedAmount = investment.earnedAmount || 0;
      const newEarnedAmount = currentEarnedAmount + hourlyRoiAmount;
      
      console.log(`      ${investment._id}: ${currentEarnedAmount.toFixed(4)} → ${newEarnedAmount.toFixed(4)} (+${hourlyRoiAmount.toFixed(4)})`);
    }
    console.log('');
    
    // Test 5: Check if investments are accumulating ROI correctly
    console.log('📊 Test 5: ROI Accumulation Analysis');
    activeInvestments.forEach(inv => {
      const startDate = new Date(inv.startDate);
      const daysElapsed = Math.max(0, Math.floor((now - startDate) / (1000 * 60 * 60 * 24)));
      const expectedDailyRoi = (inv.amount * inv.dailyRoi) / 100;
      const expectedTotalRoi = expectedDailyRoi * daysElapsed;
      
      if (inv.earnedAmount < expectedTotalRoi * 0.9) {
        console.log(`      ⚠️  ${inv._id}: earnedAmount (${inv.earnedAmount}) is lower than expected (${expectedTotalRoi.toFixed(4)})`);
      } else {
        console.log(`      ✅ ${inv._id}: earnedAmount (${inv.earnedAmount}) is within expected range`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error testing cron jobs:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await testCronJobs();
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

module.exports = { testCronJobs };
