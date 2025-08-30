import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/investment';
await mongoose.connect(MONGODB_URI);
console.log('✅ Connected to MongoDB');

// Define schemas for analysis
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
  isAutomated: Boolean,
  description: String,
  reference: String
});

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  balance: Number,
  currency: String,
  type: String
});

const Investment = mongoose.model('Investment', investmentSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Wallet = mongoose.model('Wallet', walletSchema);

async function deepCodebaseAnalysis() {
  console.log('🔍 DEEP CODEBASE ANALYSIS - INVESTMENT SYSTEM\n');
  console.log('=' .repeat(80));
  
  try {
    console.log('📊 1. INVESTMENT HOURLY ROI SYSTEM ANALYSIS');
    console.log('=' .repeat(60));
    
    // Check all active investments
    const activeInvestments = await Investment.find({ status: 'active' });
    console.log(`📊 Total Active Investments: ${activeInvestments.length}`);
    
    if (activeInvestments.length > 0) {
      console.log('\n📋 Active Investment Details:');
      activeInvestments.forEach((inv, index) => {
        const now = new Date();
        const startDate = new Date(inv.startDate);
        const lastUpdate = inv.lastRoiUpdate ? new Date(inv.lastRoiUpdate) : startDate;
        const nextUpdate = inv.nextRoiUpdate ? new Date(inv.nextRoiUpdate) : null;
        
        const hoursSinceStart = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        const hoursSinceLastUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
        const isOverdue = nextUpdate && nextUpdate < now;
        
        console.log(`\n   ${index + 1}. Investment: ${inv._id}`);
        console.log(`      Amount: ₦${inv.amount.toLocaleString()}`);
        console.log(`      Daily ROI: ${inv.dailyRoi}%`);
        console.log(`      Start: ${startDate.toISOString()}`);
        console.log(`      Hours since start: ${hoursSinceStart.toFixed(2)}`);
        console.log(`      Hours since last update: ${hoursSinceLastUpdate.toFixed(2)}`);
        console.log(`      Last ROI Update: ${inv.lastRoiUpdate ? inv.lastRoiUpdate.toISOString() : 'Never'}`);
        console.log(`      Next ROI Update: ${nextUpdate ? nextUpdate.toISOString() : 'Not set'}`);
        console.log(`      Is Overdue: ${isOverdue ? 'YES ⚠️' : 'No'}`);
        console.log(`      Current Earnings: ₦${inv.earnedAmount?.toFixed(4) || '0'}`);
        console.log(`      Total Accumulated: ₦${inv.totalAccumulatedRoi?.toFixed(4) || '0'}`);
      });
    }
    
    console.log('\n' + '=' .repeat(80));
    console.log('📊 2. DAILY INVESTMENT COUNTDOWN & AUTO-WITHDRAWAL ANALYSIS');
    console.log('=' .repeat(60));
    
    // Check investments approaching 24-hour cycles
    const now = new Date();
    const investmentsNear24Hour = activeInvestments.filter(inv => {
      if (!inv.nextRoiCycleDate) return false;
      const timeToCycle = inv.nextRoiCycleDate.getTime() - now.getTime();
      const hoursToCycle = timeToCycle / (1000 * 60 * 60);
      return hoursToCycle <= 24; // Within next 24 hours
    });
    
    console.log(`📊 Investments approaching 24-hour cycle: ${investmentsNear24Hour.length}`);
    
    if (investmentsNear24Hour.length > 0) {
      console.log('\n📋 24-Hour Cycle Analysis:');
      investmentsNear24Hour.forEach((inv, index) => {
        const timeToCycle = inv.nextRoiCycleDate.getTime() - now.getTime();
        const hoursToCycle = timeToCycle / (1000 * 60 * 60);
        const minutesToCycle = (timeToCycle % (1000 * 60 * 60)) / (1000 * 60);
        
        console.log(`\n   ${index + 1}. Investment: ${inv._id}`);
        console.log(`      Time to 24-hour cycle: ${Math.floor(hoursToCycle)}h ${Math.floor(minutesToCycle)}m`);
        console.log(`      Current Cycle Earnings: ₦${inv.earnedAmount?.toFixed(4) || '0'}`);
        console.log(`      Will be withdrawn to wallet: ₦${inv.earnedAmount?.toFixed(4) || '0'}`);
      });
    }
    
    // Check if 24-hour cycles start from investment creation
    console.log('\n📋 24-Hour Cycle Start Time Verification:');
    activeInvestments.slice(0, 3).forEach((inv, index) => {
      const startDate = new Date(inv.startDate);
      const expectedCycleDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      const actualCycleDate = inv.nextRoiCycleDate ? new Date(inv.nextRoiCycleDate) : null;
      
      console.log(`\n   ${index + 1}. Investment: ${inv._id}`);
      console.log(`      Investment Start: ${startDate.toISOString()}`);
      console.log(`      Expected 24h Cycle: ${expectedCycleDate.toISOString()}`);
      console.log(`      Actual 24h Cycle: ${actualCycleDate ? actualCycleDate.toISOString() : 'Not set'}`);
      
      if (actualCycleDate) {
        const diff = Math.abs(actualCycleDate.getTime() - expectedCycleDate.getTime());
        const diffHours = diff / (1000 * 60 * 60);
        if (diffHours > 0.1) {
          console.log(`      ⚠️  TIMING MISMATCH: ${diffHours.toFixed(2)} hours difference`);
        } else {
          console.log(`      ✅ Timing matches investment start`);
        }
      }
    });
    
    console.log('\n' + '=' .repeat(80));
    console.log('📊 3. ROI HISTORY & FRONTEND REFLECTION ANALYSIS');
    console.log('=' .repeat(60));
    
    // Check ROI transaction history
    const allRoiTransactions = await Transaction.find({ type: 'roi' }).sort({ createdAt: -1 });
    console.log(`📊 Total ROI Transactions: ${allRoiTransactions.length}`);
    
    if (allRoiTransactions.length > 0) {
      console.log('\n📋 Recent ROI Transactions (Last 10):');
      allRoiTransactions.slice(0, 10).forEach((tx, index) => {
        console.log(`   ${index + 1}. ${tx.createdAt.toISOString()} - Investment: ${tx.investmentId} - ₦${tx.amount.toFixed(4)} - ${tx.isAutomated ? 'Auto' : 'Manual'}`);
      });
    }
    
    // Check if investments have corresponding ROI transactions
    console.log('\n📋 Investment ROI Transaction Mapping:');
    let investmentsWithRoi = 0;
    let investmentsWithoutRoi = 0;
    
    for (const inv of activeInvestments.slice(0, 5)) {
      const roiCount = await Transaction.countDocuments({
        investmentId: inv._id,
        type: 'roi'
      });
      
      if (roiCount > 0) {
        investmentsWithRoi++;
        console.log(`   ✅ ${inv._id}: ${roiCount} ROI transactions`);
      } else {
        investmentsWithoutRoi++;
        console.log(`   ❌ ${inv._id}: 0 ROI transactions`);
      }
    }
    
    console.log(`\n📊 Summary: ${investmentsWithRoi} with ROI, ${investmentsWithoutRoi} without ROI`);
    
    console.log('\n' + '=' .repeat(80));
    console.log('📊 4. 30-DAY CYCLE END & AUTO-TRANSFER ANALYSIS');
    console.log('=' .repeat(60));
    
    // Check investments approaching 30-day end
    const investmentsNearEnd = activeInvestments.filter(inv => {
      const timeToEnd = inv.endDate.getTime() - now.getTime();
      const daysToEnd = timeToEnd / (1000 * 60 * 60 * 24);
      return daysToEnd <= 1; // Within 1 day of ending
    });
    
    console.log(`📊 Investments ending within 1 day: ${investmentsNearEnd.length}`);
    
    if (investmentsNearEnd.length > 0) {
      console.log('\n📋 Ending Investments Analysis:');
      investmentsNearEnd.forEach((inv, index) => {
        const timeToEnd = inv.endDate.getTime() - now.getTime();
        const daysToEnd = timeToEnd / (1000 * 60 * 60 * 24);
        const hoursToEnd = (timeToEnd % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60);
        
        console.log(`\n   ${index + 1}. Investment: ${inv._id}`);
        console.log(`      Time to end: ${Math.floor(daysToEnd)}d ${Math.floor(hoursToEnd)}h`);
        console.log(`      Original Amount: ₦${inv.amount.toLocaleString()}`);
        console.log(`      Total Earnings: ₦${inv.totalAccumulatedRoi?.toFixed(4) || '0'}`);
        console.log(`      Will be transferred: ₦${(inv.amount + (inv.totalAccumulatedRoi || 0)).toFixed(2)}`);
      });
    }
    
    // Check completed investments
    const completedInvestments = await Investment.find({ status: 'completed' });
    console.log(`\n📊 Completed Investments: ${completedInvestments.length}`);
    
    if (completedInvestments.length > 0) {
      console.log('\n📋 Completed Investment Analysis:');
      completedInvestments.slice(0, 3).forEach((inv, index) => {
        console.log(`\n   ${index + 1}. Investment: ${inv._id}`);
        console.log(`      End Date: ${inv.endDate.toISOString()}`);
        console.log(`      Final Amount: ₦${inv.amount.toLocaleString()}`);
        console.log(`      Total Earnings: ₦${inv.totalAccumulatedRoi?.toFixed(4) || '0'}`);
        console.log(`      Should be in wallet: ₦${(inv.amount + (inv.totalAccumulatedRoi || 0)).toFixed(2)}`);
      });
    }
    
    console.log('\n' + '=' .repeat(80));
    console.log('📊 5. SYSTEM HEALTH & CONFIGURATION ANALYSIS');
    console.log('=' .repeat(60));
    
    // Check testing mode settings
    const settingsCollection = mongoose.connection.db.collection('settings');
    const testingModeSettings = await settingsCollection.findOne({ key: 'roi-testing-mode' });
    
    if (testingModeSettings) {
      console.log('📊 Testing Mode Configuration:');
      console.log(`   Enabled: ${testingModeSettings.value.enabled}`);
      console.log(`   Hourly Interval: ${testingModeSettings.value.hourlyUpdateInterval / 1000}s`);
      console.log(`   Daily Interval: ${testingModeSettings.value.dailyCycleInterval / 60000}m`);
      console.log(`   Monthly Interval: ${testingModeSettings.value.monthlyCycleInterval / 3600000}h`);
    } else {
      console.log('📊 Testing Mode: Not configured (using defaults)');
    }
    
    // Check cron job execution
    const recentTransactions = await Transaction.find({
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    });
    
    console.log(`\n📊 Recent Activity (Last Hour):`);
    console.log(`   Total Transactions: ${recentTransactions.length}`);
    console.log(`   ROI Transactions: ${recentTransactions.filter(tx => tx.type === 'roi').length}`);
    console.log(`   Automated Transactions: ${recentTransactions.filter(tx => tx.isAutomated).length}`);
    
    console.log('\n' + '=' .repeat(80));
    console.log('📊 6. CRITICAL ISSUES & RECOMMENDATIONS');
    console.log('=' .repeat(60));
    
    const issues = [];
    
    // Check for overdue investments
    const overdueInvestments = activeInvestments.filter(inv => {
      if (!inv.nextRoiUpdate) return false;
      return new Date(inv.nextRoiUpdate) < now;
    });
    
    if (overdueInvestments.length > 0) {
      issues.push(`${overdueInvestments.length} investments are overdue for ROI updates`);
    }
    
    // Check for investments without ROI transactions
    if (investmentsWithoutRoi > 0) {
      issues.push(`${investmentsWithoutRoi} active investments have no ROI transactions`);
    }
    
    // Check for timing mismatches
    const timingMismatches = activeInvestments.filter(inv => {
      if (!inv.nextRoiCycleDate) return false;
      const expected = new Date(inv.startDate.getTime() + 24 * 60 * 60 * 1000);
      const actual = new Date(inv.nextRoiCycleDate);
      const diff = Math.abs(actual.getTime() - expected.getTime());
      return diff > 60 * 60 * 1000; // More than 1 hour difference
    });
    
    if (timingMismatches.length > 0) {
      issues.push(`${timingMismatches.length} investments have 24-hour cycle timing mismatches`);
    }
    
    if (issues.length === 0) {
      console.log('✅ No critical issues detected');
    } else {
      console.log(`⚠️  ${issues.length} critical issues found:`);
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('   1. Ensure backend cron jobs are running');
    console.log('   2. Verify testing mode configuration');
    console.log('   3. Check for overdue investments and process them');
    console.log('   4. Verify 24-hour cycle timing calculations');
    console.log('   5. Ensure ROI transactions are being created');
    console.log('   6. Monitor 30-day cycle completion and auto-transfer');
    
    console.log('\n' + '=' .repeat(80));
    console.log('📊 7. ANALYSIS SUMMARY');
    console.log('=' .repeat(60));
    
    console.log(`📊 Total Active Investments: ${activeInvestments.length}`);
    console.log(`📊 Investments with ROI: ${investmentsWithRoi}`);
    console.log(`📊 Investments without ROI: ${investmentsWithoutRoi}`);
    console.log(`📊 Overdue Investments: ${overdueInvestments.length}`);
    console.log(`📊 Timing Mismatches: ${timingMismatches.length}`);
    console.log(`📊 Total ROI Transactions: ${allRoiTransactions.length}`);
    console.log(`📊 Completed Investments: ${completedInvestments.length}`);
    
    if (issues.length > 0) {
      console.log(`\n❌ Status: ${issues.length} issues require attention`);
      console.log(`💡 Priority: Fix cron job execution and process overdue investments`);
    } else {
      console.log(`\n✅ Status: All systems appear to be functioning correctly`);
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the deep analysis
deepCodebaseAnalysis();
