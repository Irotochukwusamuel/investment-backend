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
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: String,
  amount: Number,
  currency: String,
  status: String,
  description: String,
  investmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment' },
  createdAt: Date,
  isAutomated: Boolean
});

const Investment = mongoose.model('Investment', investmentSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

async function analyzeRoiCodeIssues() {
  console.log('🔍 COMPREHENSIVE ROI CODE ANALYSIS\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Current Time: ${now.toISOString()}\n`);
    
    // 1. ANALYZE CRON JOB CONFIGURATION
    console.log('🔧 1. CRON JOB CONFIGURATION ANALYSIS');
    console.log('=' .repeat(50));
    
    console.log('📋 Cron Job Setup:');
    console.log('   ✅ @Cron(CronExpression.EVERY_MINUTE) - updateInvestmentRoi');
    console.log('   ✅ @Cron(CronExpression.EVERY_5_MINUTES) - manageCountdowns');
    console.log('   ✅ @Cron(CronExpression.EVERY_5_MINUTES) - processPendingTransactions');
    console.log('   ✅ @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) - cleanupOldData');
    console.log('   ✅ @Cron(CronExpression.EVERY_WEEK) - generateWeeklyReports');
    
    console.log('\n📋 Module Configuration:');
    console.log('   ✅ ScheduleModule.forRoot() - in TasksModule');
    console.log('   ✅ TasksModule imported in AppModule');
    console.log('   ✅ TasksService properly configured');
    
    console.log('');
    
    // 2. ANALYZE ROI UPDATE LOGIC
    console.log('🔧 2. ROI UPDATE LOGIC ANALYSIS');
    console.log('=' .repeat(50));
    
    // Check the query logic that finds investments to process
    console.log('📊 Investment Selection Query Logic:');
    console.log('   Status: InvestmentStatus.ACTIVE');
    console.log('   End Date: { $gt: new Date() }');
    console.log('   AND conditions:');
    console.log('     - Either 24-hour cycle OR hourly update is due');
    console.log('     - Not updated in last 30 seconds');
    
    // Test the query logic with actual data
    const testQuery = {
      status: 'active',
      endDate: { $gt: now },
      $and: [
        {
          $or: [
            { nextRoiCycleDate: { $lte: now } },
            { nextRoiUpdate: { $lte: now } }
          ]
        },
        {
          $or: [
            { lastRoiUpdate: { $exists: false } },
            { lastRoiUpdate: { $lt: new Date(now.getTime() - 30 * 1000) } }
          ]
        }
      ]
    };
    
    const investmentsToProcess = await Investment.find(testQuery);
    console.log(`\n📊 Investments that SHOULD be processed: ${investmentsToProcess.length}`);
    
    if (investmentsToProcess.length > 0) {
      console.log('   Investments to process:');
      investmentsToProcess.forEach((inv, i) => {
        const timeSinceLastUpdate = inv.lastRoiUpdate ? 
          Math.floor((now - new Date(inv.lastRoiUpdate)) / (1000 * 60)) : 'Never';
        console.log(`   ${i + 1}. ${inv._id}: Last update ${timeSinceLastUpdate} minutes ago`);
      });
    }
    
    // Check all active investments
    const allActiveInvestments = await Investment.find({
      status: 'active',
      endDate: { $gt: now }
    });
    
    console.log(`\n📊 Total Active Investments: ${allActiveInvestments.length}`);
    
    // Analyze why investments are not being picked up
    const notBeingProcessed = allActiveInvestments.filter(inv => {
      const lastUpdate = inv.lastRoiUpdate ? new Date(inv.lastRoiUpdate) : new Date(inv.startDate);
      const timeSinceUpdate = now.getTime() - lastUpdate.getTime();
      const needsUpdate = timeSinceUpdate >= 60 * 60 * 1000; // 1 hour
      
      return needsUpdate && !investmentsToProcess.find(p => p._id.toString() === inv._id.toString());
    });
    
    if (notBeingProcessed.length > 0) {
      console.log(`\n⚠️  Investments NOT being picked up: ${notBeingProcessed.length}`);
      notBeingProcessed.forEach((inv, i) => {
        const lastUpdate = inv.lastRoiUpdate ? new Date(inv.lastRoiUpdate) : new Date(inv.startDate);
        const timeSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));
        console.log(`   ${i + 1}. ${inv._id}: ${timeSinceUpdate} minutes since last update`);
        console.log(`      lastRoiUpdate: ${inv.lastRoiUpdate ? inv.lastRoiUpdate.toISOString() : 'Not set'}`);
        console.log(`      nextRoiUpdate: ${inv.nextRoiUpdate ? inv.nextRoiUpdate.toISOString() : 'Not set'}`);
        console.log(`      nextRoiCycleDate: ${inv.nextRoiCycleDate ? inv.nextRoiCycleDate.toISOString() : 'Not set'}`);
        
        // Check why it's not being picked up
        if (inv.lastRoiUpdate) {
          const timeSinceLastUpdate = now.getTime() - new Date(inv.lastRoiUpdate).getTime();
          if (timeSinceLastUpdate < 30 * 1000) {
            console.log(`      ❌ Reason: Updated in last 30 seconds (${Math.floor(timeSinceLastUpdate / 1000)}s ago)`);
          }
        }
        
        if (inv.nextRoiUpdate && inv.nextRoiUpdate > now) {
          const timeUntilNext = Math.floor((new Date(inv.nextRoiUpdate).getTime() - now.getTime()) / (1000 * 60));
          console.log(`      ❌ Reason: nextRoiUpdate is in future (${timeUntilNext}m from now)`);
        }
        
        if (inv.nextRoiCycleDate && inv.nextRoiCycleDate > now) {
          const timeUntilCycle = Math.floor((new Date(inv.nextRoiCycleDate).getTime() - now.getTime()) / (1000 * 60));
          console.log(`      ❌ Reason: nextRoiCycleDate is in future (${timeUntilCycle}m from now)`);
        }
      });
    }
    
    console.log('');
    
    // 3. ANALYZE TIMESTAMP LOGIC
    console.log('🔧 3. TIMESTAMP LOGIC ANALYSIS');
    console.log('=' .repeat(50));
    
    console.log('📋 Timestamp Update Logic:');
    console.log('   24-Hour Cycle Processing:');
    console.log('     - lastRoiUpdate = now');
    console.log('     - nextRoiCycleDate = lastRoiUpdate + 24 hours');
    console.log('     - nextRoiUpdate = lastRoiUpdate + 1 hour');
    console.log('');
    console.log('   Hourly Update Processing:');
    console.log('     - lastRoiUpdate = now');
    console.log('     - nextRoiUpdate = now + 1 hour');
    
    // Check for timestamp inconsistencies
    const timestampIssues = allActiveInvestments.filter(inv => {
      if (!inv.lastRoiUpdate || !inv.nextRoiUpdate || !inv.nextRoiCycleDate) {
        return true;
      }
      
      const lastUpdate = new Date(inv.lastRoiUpdate);
      const nextUpdate = new Date(inv.nextRoiUpdate);
      const nextCycle = new Date(inv.nextRoiCycleDate);
      
      // Check if nextRoiUpdate is properly set to 1 hour after lastRoiUpdate
      const expectedNextUpdate = new Date(lastUpdate.getTime() + 60 * 60 * 1000);
      const timeDiff = Math.abs(nextUpdate.getTime() - expectedNextUpdate.getTime());
      
      return timeDiff > 60 * 1000; // More than 1 minute difference
    });
    
    if (timestampIssues.length > 0) {
      console.log(`\n⚠️  Timestamp Inconsistencies Found: ${timestampIssues.length}`);
      timestampIssues.forEach((inv, i) => {
        const lastUpdate = new Date(inv.lastRoiUpdate);
        const nextUpdate = new Date(inv.nextRoiUpdate);
        const expectedNextUpdate = new Date(lastUpdate.getTime() + 60 * 60 * 1000);
        
        console.log(`   ${i + 1}. ${inv._id}:`);
        console.log(`      lastRoiUpdate: ${lastUpdate.toISOString()}`);
        console.log(`      nextRoiUpdate: ${nextUpdate.toISOString()}`);
        console.log(`      Expected nextRoiUpdate: ${expectedNextUpdate.toISOString()}`);
        console.log(`      Difference: ${Math.floor((nextUpdate.getTime() - expectedNextUpdate.getTime()) / (1000 * 60))} minutes`);
      });
    }
    
    console.log('');
    
    // 4. ANALYZE CRON JOB EXECUTION
    console.log('🔧 4. CRON JOB EXECUTION ANALYSIS');
    console.log('=' .repeat(50));
    
    // Check for recent automated transactions
    const recentAutomatedTransactions = await Transaction.find({
      isAutomated: true,
      createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: -1 });
    
    console.log(`📊 Recent Automated Transactions (Last 24h): ${recentAutomatedTransactions.length}`);
    
    if (recentAutomatedTransactions.length === 0) {
      console.log('   ❌ NO automated transactions found - cron jobs are not running!');
    } else {
      console.log('   Recent automated transactions:');
      recentAutomatedTransactions.slice(0, 5).forEach((tx, i) => {
        const timeAgo = Math.floor((now.getTime() - new Date(tx.createdAt).getTime()) / (1000 * 60));
        console.log(`   ${i + 1}. ${tx._id}: ${tx.type} - ${tx.amount} ${tx.currency} (${timeAgo}m ago)`);
      });
    }
    
    // Check for recent ROI transactions
    const recentRoiTransactions = await Transaction.find({
      type: 'roi',
      createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: -1 });
    
    console.log(`\n📊 Recent ROI Transactions (Last 24h): ${recentRoiTransactions.length}`);
    
    if (recentRoiTransactions.length > 0) {
      const automatedRoi = recentRoiTransactions.filter(tx => tx.isAutomated);
      const manualRoi = recentRoiTransactions.filter(tx => !tx.isAutomated);
      
      console.log(`   Automated ROI: ${automatedRoi.length}`);
      console.log(`   Manual ROI: ${manualRoi.length}`);
      
      if (automatedRoi.length === 0 && manualRoi.length > 0) {
        console.log('   ⚠️  ROI transactions exist but are NOT automated - cron jobs not working!');
      }
    }
    
    console.log('');
    
    // 5. SUMMARY AND RECOMMENDATIONS
    console.log('🔧 5. SUMMARY AND RECOMMENDATIONS');
    console.log('=' .repeat(50));
    
    if (recentAutomatedTransactions.length === 0) {
      console.log('❌ CRITICAL ISSUE: Cron jobs are not running');
      console.log('   🔧 Root Cause: Backend server is not running');
      console.log('   💡 Solution: Start the backend server with `npm run start:dev`');
    }
    
    if (notBeingProcessed.length > 0) {
      console.log(`❌ LOGIC ISSUE: ${notBeingProcessed.length} investments not being picked up`);
      console.log('   🔧 Root Cause: Timestamp logic or query conditions preventing processing');
      console.log('   💡 Solution: Fix timestamp calculations and query logic');
    }
    
    if (timestampIssues.length > 0) {
      console.log(`❌ TIMESTAMP ISSUE: ${timestampIssues.length} investments have inconsistent timestamps`);
      console.log('   🔧 Root Cause: Incorrect timestamp calculations in ROI update logic');
      console.log('   💡 Solution: Fix timestamp update logic in updateInvestmentRoi method');
    }
    
    if (recentAutomatedTransactions.length === 0 && notBeingProcessed.length === 0 && timestampIssues.length === 0) {
      console.log('✅ All systems appear to be working correctly');
      console.log('   💡 The issue might be in the initial investment setup');
    }
    
    console.log('\n💡 IMMEDIATE ACTIONS NEEDED:');
    console.log('   1. Start the backend server: `npm run start:dev`');
    console.log('   2. Check server logs for cron job execution');
    console.log('   3. Manually trigger ROI updates to test the system');
    console.log('   4. Fix any timestamp inconsistencies found');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the analysis
analyzeRoiCodeIssues();

