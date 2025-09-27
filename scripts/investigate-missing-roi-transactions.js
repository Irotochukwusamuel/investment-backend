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
  isAutomated: Boolean,
  description: String,
  reference: String
});

const userSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String
});

const Investment = mongoose.model('Investment', investmentSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const User = mongoose.model('User', userSchema);

async function investigateMissingRoiTransactions() {
  console.log('🔍 INVESTIGATING MISSING ROI TRANSACTIONS\n');
  console.log('=' .repeat(80));
  
  try {
    const investmentId = '68b2d39a7a71730cb66f470b';
    console.log(`📊 Target Investment ID: ${investmentId}\n`);
    
    // 1. INVESTMENT DETAILS
    console.log('🔧 1. INVESTMENT DETAILS');
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
    
    // 2. USER DETAILS
    console.log('🔧 2. USER DETAILS');
    console.log('=' .repeat(50));
    
    const user = await User.findById(investment.userId);
    if (user) {
      console.log(`👤 User: ${user.firstName} ${user.lastName} (${user.email})`);
    } else {
      console.log(`❌ User not found for ID: ${investment.userId}`);
    }
    
    console.log('');
    
    // 3. ALL TRANSACTIONS FOR THIS INVESTMENT
    console.log('🔧 3. ALL TRANSACTIONS FOR THIS INVESTMENT');
    console.log('=' .repeat(50));
    
    const allTransactions = await Transaction.find({
      investmentId: investment._id
    }).sort({ createdAt: 1 });
    
    console.log(`📊 Total transactions found: ${allTransactions.length}`);
    
    if (allTransactions.length > 0) {
      allTransactions.forEach((tx, index) => {
        console.log(`   ${index + 1}. ${tx.type.toUpperCase()} - ₦${tx.amount.toFixed(2)} - ${tx.status} - ${tx.createdAt.toISOString()}`);
        if (tx.description) console.log(`      Description: ${tx.description}`);
        if (tx.reference) console.log(`      Reference: ${tx.reference}`);
        console.log(`      Automated: ${tx.isAutomated ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('❌ No transactions found for this investment');
    }
    
    console.log('');
    
    // 4. ROI TRANSACTIONS ANALYSIS
    console.log('🔧 4. ROI TRANSACTIONS ANALYSIS');
    console.log('=' .repeat(50));
    
    const roiTransactions = await Transaction.find({
      investmentId: investment._id,
      type: 'roi'
    }).sort({ createdAt: 1 });
    
    console.log(`📊 ROI transactions found: ${roiTransactions.length}`);
    
    if (roiTransactions.length === 0) {
      console.log('❌ No ROI transactions found - this is the problem!');
      
      // Check if there are any ROI transactions at all in the system
      const allRoiTransactions = await Transaction.find({ type: 'roi' }).limit(10);
      console.log(`📊 Total ROI transactions in system: ${await Transaction.countDocuments({ type: 'roi' })}`);
      
      if (allRoiTransactions.length > 0) {
        console.log('📋 Sample ROI transactions from system:');
        allRoiTransactions.forEach((tx, index) => {
          console.log(`   ${index + 1}. Investment: ${tx.investmentId} - ₦${tx.amount.toFixed(2)} - ${tx.createdAt.toISOString()}`);
        });
      }
    }
    
    console.log('');
    
    // 5. INVESTMENT PLAN ANALYSIS
    console.log('🔧 5. INVESTMENT PLAN ANALYSIS');
    console.log('=' .repeat(50));
    
    // Check if this investment plan has ROI transactions
    const planRoiTransactions = await Transaction.find({
      type: 'roi'
    }).populate('investmentId');
    
    const planTransactions = planRoiTransactions.filter(tx => 
      tx.investmentId && tx.investmentId.planId && 
      tx.investmentId.planId.toString() === investment.planId.toString()
    );
    
    console.log(`📊 ROI transactions for this plan type: ${planTransactions.length}`);
    
    if (planTransactions.length > 0) {
      console.log('📋 Sample plan ROI transactions:');
      planTransactions.slice(0, 5).forEach((tx, index) => {
        console.log(`   ${index + 1}. Investment: ${tx.investmentId._id} - ₦${tx.amount.toFixed(2)} - ${tx.createdAt.toISOString()}`);
      });
    }
    
    console.log('');
    
    // 6. TIMING ANALYSIS
    console.log('🔧 6. TIMING ANALYSIS');
    console.log('=' .repeat(50));
    
    const now = new Date();
    const startDate = new Date(investment.startDate);
    const lastUpdate = investment.lastRoiUpdate ? new Date(investment.lastRoiUpdate) : startDate;
    
    console.log(`⏰ Current Time: ${now.toISOString()}`);
    console.log(`⏰ Investment Start: ${startDate.toISOString()}`);
    console.log(`⏰ Last ROI Update: ${lastUpdate.toISOString()}`);
    console.log(`⏰ Next ROI Update: ${investment.nextRoiUpdate ? investment.nextRoiUpdate.toISOString() : 'Not set'}`);
    console.log(`⏰ Next ROI Cycle: ${investment.nextRoiCycleDate ? investment.nextRoiCycleDate.toISOString() : 'Not set'}`);
    
    // Check if investment should have had ROI updates
    const timeSinceStart = now.getTime() - startDate.getTime();
    const timeSinceLastUpdate = now.getTime() - lastUpdate.getTime();
    const hoursSinceStart = timeSinceStart / (1000 * 60 * 60);
    const hoursSinceLastUpdate = timeSinceLastUpdate / (1000 * 60 * 60);
    
    console.log(`⏰ Hours since start: ${hoursSinceStart.toFixed(2)}`);
    console.log(`⏰ Hours since last update: ${hoursSinceLastUpdate.toFixed(2)}`);
    
    // Check if nextRoiUpdate is in the past
    if (investment.nextRoiUpdate && investment.nextRoiUpdate < now) {
      console.log(`⚠️  Next ROI Update is in the past! Should have been processed already.`);
    }
    
    console.log('');
    
    // 7. SYSTEM-WIDE ROI TRANSACTION ANALYSIS
    console.log('🔧 7. SYSTEM-WIDE ROI TRANSACTION ANALYSIS');
    console.log('=' .repeat(50));
    
    // Check recent ROI transactions
    const recentRoiTransactions = await Transaction.find({
      type: 'roi',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).sort({ createdAt: -1 });
    
    console.log(`📊 ROI transactions in last 24 hours: ${recentRoiTransactions.length}`);
    
    if (recentRoiTransactions.length > 0) {
      console.log('📋 Recent ROI transactions:');
      recentRoiTransactions.slice(0, 5).forEach((tx, index) => {
        console.log(`   ${index + 1}. ${tx.createdAt.toISOString()} - Investment: ${tx.investmentId} - ₦${tx.amount.toFixed(2)}`);
      });
    }
    
    // Check automated vs manual ROI transactions
    const automatedRoiCount = await Transaction.countDocuments({ type: 'roi', isAutomated: true });
    const manualRoiCount = await Transaction.countDocuments({ type: 'roi', isAutomated: false });
    
    console.log(`🤖 Automated ROI transactions: ${automatedRoiCount}`);
    console.log(`👤 Manual ROI transactions: ${manualRoiCount}`);
    
    console.log('');
    
    // 8. POTENTIAL ROOT CAUSES
    console.log('🔧 8. POTENTIAL ROOT CAUSES');
    console.log('=' .repeat(50));
    
    const rootCauses = [];
    
    // Check if cron jobs are running
    if (investment.nextRoiUpdate && investment.nextRoiUpdate < now) {
      rootCauses.push('Cron job not processing overdue investments');
    }
    
    // Check if investment is too new
    if (hoursSinceStart < 1) {
      rootCauses.push('Investment too new (< 1 hour) - may not have triggered ROI yet');
    }
    
    // Check if no ROI transactions exist in system
    if (await Transaction.countDocuments({ type: 'roi' }) === 0) {
      rootCauses.push('No ROI transactions exist in entire system - cron job may not be running');
    }
    
    // Check if this investment plan type has issues
    if (planTransactions.length === 0) {
      rootCauses.push('No ROI transactions for this investment plan type');
    }
    
    if (rootCauses.length === 0) {
      console.log('✅ No obvious root causes identified');
    } else {
      console.log(`⚠️  ${rootCauses.length} potential root causes:`);
      rootCauses.forEach((cause, index) => {
        console.log(`   ${index + 1}. ${cause}`);
      });
    }
    
    console.log('');
    
    // 9. RECOMMENDATIONS
    console.log('🔧 9. RECOMMENDATIONS');
    console.log('=' .repeat(50));
    
    console.log('💡 IMMEDIATE ACTIONS:');
    console.log('   1. Check if backend cron jobs are running');
    console.log('   2. Verify ROI update cron job configuration');
    console.log('   3. Check cron job logs for errors');
    console.log('   4. Manually trigger ROI update for this investment');
    
    console.log('\n💡 INVESTIGATION STEPS:');
    console.log('   1. Check backend server status');
    console.log('   2. Review cron job execution logs');
    console.log('   3. Verify testing mode settings');
    console.log('   4. Check if other investments have ROI transactions');
    
    console.log('\n💡 FIX OPTIONS:');
    console.log('   1. Start backend server if not running');
    console.log('   2. Manually create ROI transaction');
    console.log('   3. Reset investment timestamps');
    console.log('   4. Run ROI update manually');
    
    console.log('');
    
    // 10. SUMMARY
    console.log('🔧 10. SUMMARY');
    console.log('=' .repeat(50));
    
    console.log(`📊 Investment: ${investmentId}`);
    console.log(`💰 Amount: ₦${investment.amount.toLocaleString()}`);
    console.log(`📈 Daily ROI: ${investment.dailyRoi}%`);
    console.log(`⏰ Hours since start: ${hoursSinceStart.toFixed(2)}`);
    console.log(`📊 Status: ${investment.status}`);
    console.log(`❌ ROI Transactions: ${roiTransactions.length}`);
    
    if (rootCauses.length > 0) {
      console.log(`⚠️  Root Causes: ${rootCauses.length}`);
      console.log(`💡 Action Required: Investigate cron job execution`);
    } else {
      console.log(`✅ Status: No obvious issues found`);
    }
    
  } catch (error) {
    console.error('❌ Investigation failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the investigation
investigateMissingRoiTransactions();








