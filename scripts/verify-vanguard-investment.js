import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/investment';
await mongoose.connect(MONGODB_URI);
console.log('✅ Connected to MongoDB');

// Define schemas
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
  earnedAmount: Number,
  totalAccumulatedRoi: Number,
  expectedReturn: Number,
  lastRoiUpdate: Date,
  nextRoiUpdate: Date,
  nextRoiCycleDate: Date
});

const Investment = mongoose.model('Investment', investmentSchema);

async function verifyVanguardInvestment() {
  console.log('🔍 VERIFYING VANGUARD INVESTMENT\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Current Time: ${now.toISOString()}\n`);
    
    // Find the specific VANGUARD investment
    const vanguardInvestment = await Investment.findById('68b27d5a57e6cfe386cc75ec');
    
    if (!vanguardInvestment) {
      console.log('❌ VANGUARD investment not found');
      return;
    }
    
    console.log('💰 VANGUARD INVESTMENT DETAILS:');
    console.log(`   ID: ${vanguardInvestment._id}`);
    console.log(`   Amount: ₦${vanguardInvestment.amount.toLocaleString()}`);
    console.log(`   Daily ROI: ${vanguardInvestment.dailyRoi}%`);
    console.log(`   Status: ${vanguardInvestment.status}`);
    console.log(`   Start Date: ${vanguardInvestment.startDate.toISOString()}`);
    console.log(`   End Date: ${vanguardInvestment.endDate.toISOString()}`);
    console.log('');
    
    console.log('📊 CURRENT ROI VALUES:');
    console.log(`   earnedAmount (Current Cycle Earnings): ₦${vanguardInvestment.earnedAmount || 0}`);
    console.log(`   totalAccumulatedRoi (Total Earnings Since Start): ₦${vanguardInvestment.totalAccumulatedRoi || 0}`);
    console.log(`   expectedReturn: ₦${vanguardInvestment.expectedReturn || 0}`);
    console.log('');
    
    // Calculate what the values should be
    const startDate = new Date(vanguardInvestment.startDate);
    const hoursElapsed = Math.max(0, Math.floor((now - startDate) / (1000 * 60 * 60)));
    const minutesElapsed = Math.max(0, Math.floor((now - startDate) / (1000 * 60)));
    
    const expectedDailyRoi = (vanguardInvestment.amount * vanguardInvestment.dailyRoi) / 100;
    const expectedHourlyRoi = expectedDailyRoi / 24;
    const expectedMinuteRoi = expectedHourlyRoi / 60;
    
    // Calculate expected values
    const expectedTotalRoi = expectedMinuteRoi * minutesElapsed;
    const expectedEarnedAmount = expectedMinuteRoi * minutesElapsed;
    
    console.log('📈 TIME ANALYSIS:');
    console.log(`   Hours since start: ${hoursElapsed}`);
    console.log(`   Minutes since start: ${minutesElapsed}`);
    console.log(`   Expected daily ROI: ₦${expectedDailyRoi.toFixed(4)}`);
    console.log(`   Expected hourly ROI: ₦${expectedHourlyRoi.toFixed(4)}`);
    console.log(`   Expected minute ROI: ₦${expectedMinuteRoi.toFixed(4)}`);
    console.log('');
    
    console.log('📊 EXPECTED VALUES:');
    console.log(`   Expected totalAccumulatedRoi: ₦${expectedTotalRoi.toFixed(4)}`);
    console.log(`   Expected earnedAmount: ₦${expectedEarnedAmount.toFixed(4)}`);
    console.log('');
    
    console.log('🔍 ANALYSIS:');
    console.log(`   Current earnedAmount: ₦${vanguardInvestment.earnedAmount || 0}`);
    console.log(`   Expected earnedAmount: ₦${expectedEarnedAmount.toFixed(4)}`);
    console.log(`   Difference: ₦${((vanguardInvestment.earnedAmount || 0) - expectedEarnedAmount).toFixed(4)}`);
    console.log('');
    
    console.log(`   Current totalAccumulatedRoi: ₦${vanguardInvestment.totalAccumulatedRoi || 0}`);
    console.log(`   Expected totalAccumulatedRoi: ₦${expectedTotalRoi.toFixed(4)}`);
    console.log(`   Difference: ₦${((vanguardInvestment.totalAccumulatedRoi || 0) - expectedTotalRoi).toFixed(4)}`);
    console.log('');
    
    // Check if the values are reasonable
    const earnedAmountDiff = Math.abs((vanguardInvestment.earnedAmount || 0) - expectedEarnedAmount);
    const totalRoiDiff = Math.abs((vanguardInvestment.totalAccumulatedRoi || 0) - expectedTotalRoi);
    
    if (earnedAmountDiff < 1) {
      console.log('✅ Current Cycle Earnings (earnedAmount) is CORRECT');
    } else {
      console.log('⚠️  Current Cycle Earnings (earnedAmount) has DISCREPANCY');
      console.log(`   Expected: ₦${expectedEarnedAmount.toFixed(4)}`);
      console.log(`   Actual: ₦${vanguardInvestment.earnedAmount || 0}`);
      console.log(`   Difference: ₦${earnedAmountDiff.toFixed(4)}`);
    }
    
    if (totalRoiDiff < 1) {
      console.log('✅ Total Earnings Since Start (totalAccumulatedRoi) is CORRECT');
    } else {
      console.log('⚠️  Total Earnings Since Start (totalAccumulatedRoi) has DISCREPANCY');
      console.log(`   Expected: ₦${expectedTotalRoi.toFixed(4)}`);
      console.log(`   Actual: ₦${vanguardInvestment.totalAccumulatedRoi || 0}`);
      console.log(`   Difference: ₦${totalRoiDiff.toFixed(4)}`);
    }
    
    console.log('');
    console.log('💡 RECOMMENDATIONS:');
    
    if (totalRoiDiff > 1) {
      console.log('   🔧 totalAccumulatedRoi needs to be updated to match expected value');
      console.log(`   🔧 Should be: ₦${expectedTotalRoi.toFixed(4)}`);
    }
    
    if (earnedAmountDiff > 1) {
      console.log('   🔧 earnedAmount needs to be updated to match expected value');
      console.log(`   🔧 Should be: ₦${expectedEarnedAmount.toFixed(4)}`);
    }
    
    if (totalRoiDiff < 1 && earnedAmountDiff < 1) {
      console.log('   ✅ All values are correct - no action needed');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the verification
verifyVanguardInvestment();








