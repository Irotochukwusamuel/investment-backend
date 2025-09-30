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
  createdAt: Date
});

const Investment = mongoose.model('Investment', investmentSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

async function investigateRoiSystem() {
  console.log('🔍 COMPREHENSIVE ROI SYSTEM INVESTIGATION\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Current Time: ${now.toISOString()}\n`);
    
    // 1. INVESTIGATE CRON JOB STATUS
    console.log('🔧 1. INVESTIGATING CRON JOB STATUS');
    console.log('=' .repeat(50));
    
    // Check if there are any recent ROI transactions (indicates cron job activity)
    const recentRoiTransactions = await Transaction.find({
      type: 'roi',
      createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).sort({ createdAt: -1 });
    
    console.log(`📊 Recent ROI Transactions (Last 24h): ${recentRoiTransactions.length}`);
    if (recentRoiTransactions.length > 0) {
      console.log('   Recent transactions:');
      recentRoiTransactions.slice(0, 5).forEach((tx, i) => {
        const timeAgo = Math.floor((now.getTime() - new Date(tx.createdAt).getTime()) / (1000 * 60));
        console.log(`   ${i + 1}. ${tx._id}: ₦${tx.amount.toFixed(4)} ${tx.currency} (${timeAgo}m ago)`);
      });
    } else {
      console.log('   ⚠️  NO recent ROI transactions found - cron job may not be running!');
    }
    
    // Check for any automated transactions
    const automatedTransactions = await Transaction.find({
      isAutomated: true,
      createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: -1 });
    
    console.log(`📊 Automated Transactions (Last 24h): ${automatedTransactions.length}`);
    if (automatedTransactions.length === 0) {
      console.log('   ⚠️  NO automated transactions - cron job definitely not running!');
    }
    
    console.log('');
    
    // 2. INVESTIGATE ROI UPDATE LOGIC
    console.log('🔧 2. INVESTIGATING ROI UPDATE LOGIC');
    console.log('=' .repeat(50));
    
    // Get all active investments that should be getting ROI updates
    const activeInvestments = await Investment.find({
      status: 'active',
      endDate: { $gt: now }
    }).sort({ startDate: 1 });
    
    console.log(`📊 Active Investments Found: ${activeInvestments.length}`);
    
    for (const investment of activeInvestments) {
      console.log(`\n💰 Investment: ${investment._id}`);
      console.log(`   Amount: ₦${investment.amount.toLocaleString()}`);
      console.log(`   Daily ROI: ${investment.dailyRoi}%`);
      console.log(`   Start Date: ${investment.startDate.toISOString()}`);
      console.log(`   Last ROI Update: ${investment.lastRoiUpdate ? investment.lastRoiUpdate.toISOString() : 'Never'}`);
      console.log(`   Next ROI Update: ${investment.nextRoiUpdate ? investment.nextRoiUpdate.toISOString() : 'Not set'}`);
      console.log(`   Next ROI Cycle: ${investment.nextRoiCycleDate ? investment.nextRoiCycleDate.toISOString() : 'Not set'}`);
      
      // Check if investment is due for ROI update
      const startDate = new Date(investment.startDate);
      const lastRoiUpdate = investment.lastRoiUpdate ? new Date(investment.lastRoiUpdate) : startDate;
      const nextRoiUpdate = investment.nextRoiUpdate ? new Date(investment.nextRoiUpdate) : null;
      const nextRoiCycle = investment.nextRoiCycleDate ? new Date(investment.nextRoiCycleDate) : null;
      
      const hoursSinceStart = Math.max(0, Math.floor((now - startDate) / (1000 * 60 * 60)));
      const hoursSinceLastUpdate = Math.max(0, Math.floor((now - lastRoiUpdate) / (1000 * 60 * 60)));
      const hoursUntilNextUpdate = nextRoiUpdate ? Math.max(0, Math.floor((nextRoiUpdate - now) / (1000 * 60 * 60))) : null;
      const hoursUntilNextCycle = nextRoiCycle ? Math.max(0, Math.floor((nextRoiCycle - now) / (1000 * 60 * 60))) : null;
      
      console.log(`   Hours since start: ${hoursSinceStart}`);
      console.log(`   Hours since last update: ${hoursSinceLastUpdate}`);
      console.log(`   Hours until next update: ${hoursUntilNextUpdate !== null ? hoursUntilNextUpdate : 'Not set'}`);
      console.log(`   Hours until next cycle: ${hoursUntilNextCycle !== null ? hoursUntilNextCycle : 'Not set'}`);
      
      // Check if investment should be getting updates
      const shouldGetHourlyUpdate = hoursSinceLastUpdate >= 1;
      const shouldGetCycleUpdate = nextRoiCycle && hoursUntilNextCycle <= 0;
      
      if (shouldGetHourlyUpdate) {
        console.log(`   ⚠️  Investment is overdue for hourly ROI update (${hoursSinceLastUpdate}h overdue)`);
      }
      
      if (shouldGetCycleUpdate) {
        console.log(`   ⚠️  Investment is overdue for 24-hour cycle update (${Math.abs(hoursUntilNextCycle)}h overdue)`);
      }
      
      if (!shouldGetHourlyUpdate && !shouldGetCycleUpdate) {
        console.log(`   ✅ Investment is up to date`);
      }
    }
    
    console.log('');
    
    // 3. INVESTIGATE SPECIFIC VANGUARD INVESTMENT
    console.log('🔧 3. INVESTIGATING VANGUARD INVESTMENT SPECIFICALLY');
    console.log('=' .repeat(50));
    
    const vanguardInvestment = await Investment.findById('68b27d5a57e6cfe386cc75ec');
    if (vanguardInvestment) {
      console.log(`💰 VANGUARD Investment Details:`);
      console.log(`   ID: ${vanguardInvestment._id}`);
      console.log(`   Status: ${vanguardInvestment.status}`);
      console.log(`   Start Date: ${vanguardInvestment.startDate.toISOString()}`);
      console.log(`   Last ROI Update: ${vanguardInvestment.lastRoiUpdate ? vanguardInvestment.lastRoiUpdate.toISOString() : 'Never'}`);
      console.log(`   Next ROI Update: ${vanguardInvestment.nextRoiUpdate ? vanguardInvestment.nextRoiUpdate.toISOString() : 'Not set'}`);
      console.log(`   Next ROI Cycle: ${vanguardInvestment.nextRoiCycleDate ? vanguardInvestment.nextRoiCycleDate.toISOString() : 'Not set'}`);
      
      // Check if it should be picked up by ROI update system
      const startDate = new Date(vanguardInvestment.startDate);
      const lastRoiUpdate = vanguardInvestment.lastRoiUpdate ? new Date(vanguardInvestment.lastRoiUpdate) : startDate;
      const nextRoiUpdate = vanguardInvestment.nextRoiUpdate ? new Date(vanguardInvestment.nextRoiUpdate) : null;
      const nextRoiCycle = vanguardInvestment.nextRoiCycleDate ? new Date(vanguardInvestment.nextRoiCycleDate) : null;
      
      const hoursSinceStart = Math.max(0, Math.floor((now - startDate) / (1000 * 60 * 60)));
      const hoursSinceLastUpdate = Math.max(0, Math.floor((now - lastRoiUpdate) / (1000 * 60 * 60)));
      const hoursUntilNextUpdate = nextRoiUpdate ? Math.max(0, Math.floor((nextRoiUpdate - now) / (1000 * 60 * 60))) : null;
      const hoursUntilNextCycle = nextRoiCycle ? Math.max(0, Math.floor((nextRoiCycle - now) / (1000 * 60 * 60))) : null;
      
      console.log(`\n📊 Timing Analysis:`);
      console.log(`   Hours since start: ${hoursSinceStart}`);
      console.log(`   Hours since last update: ${hoursSinceLastUpdate}`);
      console.log(`   Hours until next update: ${hoursUntilNextUpdate !== null ? hoursUntilNextUpdate : 'Not set'}`);
      console.log(`   Hours until next cycle: ${hoursUntilNextCycle !== null ? hoursUntilNextCycle : 'Not set'}`);
      
      // Check if it should be getting updates
      const shouldGetHourlyUpdate = hoursSinceLastUpdate >= 1;
      const shouldGetCycleUpdate = nextRoiCycle && hoursUntilNextCycle <= 0;
      
      console.log(`\n🔍 Update Status:`);
      if (shouldGetHourlyUpdate) {
        console.log(`   ⚠️  OVERDUE for hourly ROI update (${hoursSinceLastUpdate}h overdue)`);
      } else {
        console.log(`   ✅ Hourly ROI update is on schedule`);
      }
      
      if (shouldGetCycleUpdate) {
        console.log(`   ⚠️  OVERDUE for 24-hour cycle update (${Math.abs(hoursUntilNextCycle)}h overdue)`);
      } else {
        console.log(`   ✅ 24-hour cycle update is on schedule`);
      }
      
      // Check if timestamps are properly set
      if (!vanguardInvestment.nextRoiUpdate) {
        console.log(`   ⚠️  nextRoiUpdate timestamp is NOT SET`);
      }
      
      if (!vanguardInvestment.nextRoiCycleDate) {
        console.log(`   ⚠️  nextRoiCycleDate timestamp is NOT SET`);
      }
      
      if (!vanguardInvestment.lastRoiUpdate) {
        console.log(`   ⚠️  lastRoiUpdate timestamp is NOT SET`);
      }
    }
    
    console.log('');
    
    // 4. SUMMARY AND RECOMMENDATIONS
    console.log('🔧 4. SUMMARY AND RECOMMENDATIONS');
    console.log('=' .repeat(50));
    
    if (recentRoiTransactions.length === 0) {
      console.log('❌ CRON JOB ISSUE: No recent ROI transactions found');
      console.log('   🔧 The cron job is likely not running or not processing investments');
    }
    
    if (automatedTransactions.length === 0) {
      console.log('❌ AUTOMATION ISSUE: No automated transactions found');
      console.log('   🔧 The system is not automatically processing ROI updates');
    }
    
    const overdueInvestments = activeInvestments.filter(inv => {
      const lastUpdate = inv.lastRoiUpdate ? new Date(inv.lastRoiUpdate) : new Date(inv.startDate);
      const hoursSinceUpdate = Math.floor((now - lastUpdate) / (1000 * 60 * 60));
      return hoursSinceUpdate >= 1;
    });
    
    if (overdueInvestments.length > 0) {
      console.log(`❌ ROI UPDATE LOGIC ISSUE: ${overdueInvestments.length} investments are overdue for updates`);
      console.log('   🔧 The ROI update system is not processing investments on time');
    }
    
    if (overdueInvestments.length === 0 && recentRoiTransactions.length === 0) {
      console.log('✅ All systems appear to be working correctly');
      console.log('   💡 The issue might be in the initial investment setup or timestamp configuration');
    }
    
    console.log('\n💡 IMMEDIATE ACTIONS NEEDED:');
    console.log('   1. Check if the cron job is running: `pm2 status` or check server logs');
    console.log('   2. Verify the ROI update cron job is scheduled: `crontab -l`');
    console.log('   3. Check for any error logs in the application');
    console.log('   4. Manually trigger ROI updates to test the system');
    
  } catch (error) {
    console.error('❌ Investigation failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the investigation
investigateRoiSystem();










