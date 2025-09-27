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

const transactionSchema = new mongoose.Schema({
  investmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: String,
  amount: Number,
  currency: String,
  status: String,
  createdAt: Date,
  isAutomated: Boolean
});

const Investment = mongoose.model('Investment', investmentSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

async function verifyInvestmentEarnings() {
  console.log('🔍 VERIFYING INVESTMENT EARNINGS\n');
  console.log('=' .repeat(80));
  
  try {
    const investmentId = '68b2d39a7a71730cb66f470b';
    console.log(`📊 Target Investment ID: ${investmentId}\n`);
    
    // 1. FETCH THE INVESTMENT
    console.log('🔧 1. FETCHING INVESTMENT DETAILS');
    console.log('=' .repeat(50));
    
    const investment = await Investment.findById(investmentId);
    if (!investment) {
      console.log('❌ Investment not found');
      return;
    }
    
    console.log('✅ Investment found!');
    console.log(`💰 Amount: ₦${investment.amount.toLocaleString()}`);
    console.log(`📈 Daily ROI: ${investment.dailyRoi}%`);
    console.log(`📅 Start Date: ${investment.startDate.toISOString()}`);
    console.log(`📅 End Date: ${investment.endDate.toISOString()}`);
    console.log(`🔄 Status: ${investment.status}`);
    console.log(`⏰ Last ROI Update: ${investment.lastRoiUpdate ? investment.lastRoiUpdate.toISOString() : 'Never'}`);
    console.log(`⏰ Next ROI Update: ${investment.nextRoiUpdate ? investment.nextRoiUpdate.toISOString() : 'Not set'}`);
    console.log(`⏰ Next ROI Cycle: ${investment.nextRoiCycleDate ? investment.nextRoiCycleDate.toISOString() : 'Not set'}`);
    
    console.log('');
    
    // 2. CURRENT EARNINGS ANALYSIS
    console.log('🔧 2. CURRENT EARNINGS ANALYSIS');
    console.log('=' .repeat(50));
    
    console.log(`📊 Current Cycle Earnings (earnedAmount): ₦${investment.earnedAmount?.toLocaleString() || '0'}`);
    console.log(`📊 Total Earnings Since Start (totalAccumulatedRoi): ₦${investment.totalAccumulatedRoi?.toLocaleString() || '0'}`);
    console.log(`📊 Expected Return: ₦${investment.expectedReturn?.toLocaleString() || '0'}`);
    
    console.log('');
    
    // 3. CALCULATE THEORETICAL EARNINGS
    console.log('🔧 3. CALCULATING THEORETICAL EARNINGS');
    console.log('=' .repeat(50));
    
    const now = new Date();
    const startDate = new Date(investment.startDate);
    const timeElapsed = now.getTime() - startDate.getTime();
    const daysElapsed = timeElapsed / (1000 * 60 * 60 * 24);
    const hoursElapsed = timeElapsed / (1000 * 60 * 60);
    
    console.log(`⏰ Time Elapsed: ${daysElapsed.toFixed(2)} days (${hoursElapsed.toFixed(2)} hours)`);
    
    // Calculate daily earnings
    const dailyEarnings = (investment.amount * investment.dailyRoi) / 100;
    const hourlyEarnings = dailyEarnings / 24;
    
    console.log(`💰 Daily Earnings: ₦${dailyEarnings.toFixed(4)}`);
    console.log(`💰 Hourly Earnings: ₦${hourlyEarnings.toFixed(6)}`);
    
    // Calculate theoretical total earnings
    const theoreticalTotalEarnings = dailyEarnings * daysElapsed;
    const theoreticalCurrentCycleEarnings = hourlyEarnings * hoursElapsed;
    
    console.log(`📊 Theoretical Total Earnings: ₦${theoreticalTotalEarnings.toFixed(4)}`);
    console.log(`📊 Theoretical Current Cycle: ₦${theoreticalCurrentCycleEarnings.toFixed(4)}`);
    
    console.log('');
    
    // 4. ANALYZE ROI TRANSACTIONS
    console.log('🔧 4. ANALYZING ROI TRANSACTIONS');
    console.log('=' .repeat(50));
    
    const roiTransactions = await Transaction.find({
      investmentId: investment._id,
      type: 'roi',
      status: 'completed'
    }).sort({ createdAt: 1 });
    
    console.log(`📊 Found ${roiTransactions.length} ROI transactions`);
    
    if (roiTransactions.length > 0) {
      let totalRoiFromTransactions = 0;
      roiTransactions.forEach((tx, index) => {
        totalRoiFromTransactions += tx.amount;
        console.log(`   ${index + 1}. ${tx.createdAt.toISOString()}: ₦${tx.amount.toFixed(4)} (${tx.isAutomated ? 'Auto' : 'Manual'})`);
      });
      
      console.log(`💰 Total ROI from Transactions: ₦${totalRoiFromTransactions.toFixed(4)}`);
      console.log(`💰 Investment totalAccumulatedRoi: ₦${investment.totalAccumulatedRoi?.toFixed(4) || '0'}`);
      
      const transactionVsInvestmentDiff = Math.abs(totalRoiFromTransactions - (investment.totalAccumulatedRoi || 0));
      if (transactionVsInvestmentDiff > 0.01) {
        console.log(`⚠️  DISCREPANCY DETECTED: ₦${transactionVsInvestmentDiff.toFixed(4)} difference`);
      } else {
        console.log(`✅ Total ROI matches transactions`);
      }
    } else {
      console.log('❌ No ROI transactions found');
    }
    
    console.log('');
    
    // 5. IDENTIFY ISSUES
    console.log('🔧 5. IDENTIFYING ISSUES');
    console.log('=' .repeat(50));
    
    const issues = [];
    
    // Check if earnedAmount is correct
    const earnedAmountDiff = Math.abs(investment.earnedAmount - theoreticalCurrentCycleEarnings);
    if (earnedAmountDiff > 0.01) {
      issues.push(`Current Cycle Earnings (earnedAmount) is off by ₦${earnedAmountDiff.toFixed(4)}`);
      console.log(`❌ Current Cycle Earnings discrepancy: ₦${earnedAmountDiff.toFixed(4)}`);
    } else {
      console.log(`✅ Current Cycle Earnings is correct`);
    }
    
    // Check if totalAccumulatedRoi is correct
    const totalEarningsDiff = Math.abs((investment.totalAccumulatedRoi || 0) - theoreticalTotalEarnings);
    if (totalEarningsDiff > 0.01) {
      issues.push(`Total Earnings (totalAccumulatedRoi) is off by ₦${totalEarningsDiff.toFixed(4)}`);
      console.log(`❌ Total Earnings discrepancy: ₦${totalEarningsDiff.toFixed(4)}`);
    } else {
      console.log(`✅ Total Earnings is correct`);
    }
    
    // Check if transactions match investment totals
    if (roiTransactions.length > 0) {
      const transactionTotal = roiTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const investmentTotal = investment.totalAccumulatedRoi || 0;
      const transactionDiff = Math.abs(transactionTotal - investmentTotal);
      
      if (transactionDiff > 0.01) {
        issues.push(`Transaction total (₦${transactionTotal.toFixed(4)}) doesn't match investment total (₦${investmentTotal.toFixed(4)})`);
        console.log(`❌ Transaction mismatch: ₦${transactionDiff.toFixed(4)}`);
      } else {
        console.log(`✅ Transactions match investment total`);
      }
    }
    
    console.log('');
    
    // 6. FIX RECOMMENDATIONS
    console.log('🔧 6. FIX RECOMMENDATIONS');
    console.log('=' .repeat(50));
    
    if (issues.length === 0) {
      console.log('✅ No issues detected - investment earnings are correct!');
    } else {
      console.log(`⚠️  ${issues.length} issues detected:`);
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
      
      console.log('\n💡 RECOMMENDED FIXES:');
      
      if (earnedAmountDiff > 0.01) {
        console.log(`   1. Update earnedAmount to: ₦${theoreticalCurrentCycleEarnings.toFixed(4)}`);
      }
      
      if (totalEarningsDiff > 0.01) {
        console.log(`   2. Update totalAccumulatedRoi to: ₦${theoreticalTotalEarnings.toFixed(4)}`);
      }
      
      console.log('\n🔧 To apply fixes, run the fix script or manually update the database.');
    }
    
    console.log('');
    
    // 7. SUMMARY
    console.log('🔧 7. SUMMARY');
    console.log('=' .repeat(50));
    
    console.log(`📊 Investment: ${investmentId}`);
    console.log(`💰 Amount: ₦${investment.amount.toLocaleString()}`);
    console.log(`📈 Daily ROI: ${investment.dailyRoi}%`);
    console.log(`⏰ Days Elapsed: ${daysElapsed.toFixed(2)}`);
    console.log(`📊 Current Status: ${investment.status}`);
    
    if (issues.length > 0) {
      console.log(`❌ Issues Found: ${issues.length}`);
      console.log(`💡 Action Required: Fix earnings discrepancies`);
    } else {
      console.log(`✅ Status: All earnings are correct`);
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the verification
verifyInvestmentEarnings();








