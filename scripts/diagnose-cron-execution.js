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

async function diagnoseCronExecution() {
  console.log('🔍 DIAGNOSING CRON JOB EXECUTION ISSUES\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Current Time: ${now.toISOString()}\n`);
    
    // Check all active investments
    const activeInvestments = await Investment.find({
      status: 'active',
      endDate: { $gt: now }
    });
    
    console.log(`📊 Found ${activeInvestments.length} active investments\n`);
    
    let investmentsNeedingUpdates = 0;
    let investmentsWithIssues = 0;
    
    for (const investment of activeInvestments) {
      console.log('=' .repeat(60));
      console.log(`💰 INVESTMENT: ${investment._id}`);
      console.log('=' .repeat(60));
      
      const nextRoiCycleDate = investment.nextRoiCycleDate ? new Date(investment.nextRoiCycleDate) : null;
      const nextRoiUpdate = investment.nextRoiUpdate ? new Date(investment.nextRoiUpdate) : null;
      const lastRoiUpdate = investment.lastRoiUpdate ? new Date(investment.lastRoiUpdate) : null;
      
      // Check if updates are due
      const needs24HourCycle = nextRoiCycleDate && nextRoiCycleDate <= now;
      const needsHourlyUpdate = nextRoiUpdate && nextRoiUpdate <= now;
      
      // Check if last update was too recent (within 2 minutes)
      const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
      const lastUpdateTooRecent = lastRoiUpdate && lastRoiUpdate > twoMinutesAgo;
      
      console.log('📊 CURRENT STATE:');
      console.log(`   earnedAmount: ${investment.earnedAmount || 0}`);
      console.log(`   totalAccumulatedRoi: ${investment.totalAccumulatedRoi || 0}`);
      console.log(`   lastRoiUpdate: ${lastRoiUpdate ? lastRoiUpdate.toISOString() : 'Not set'}`);
      console.log(`   nextRoiUpdate: ${nextRoiUpdate ? nextRoiUpdate.toISOString() : 'Not set'}`);
      console.log(`   nextRoiCycleDate: ${nextRoiCycleDate ? nextRoiCycleDate.toISOString() : 'Not set'}`);
      console.log('');
      
      console.log('🔍 UPDATE STATUS:');
      console.log(`   24-hour cycle due: ${needs24HourCycle ? 'YES' : 'NO'}`);
      console.log(`   Hourly update due: ${needsHourlyUpdate ? 'YES' : 'NO'}`);
      console.log(`   Last update too recent: ${lastUpdateTooRecent ? 'YES' : 'NO'}`);
      console.log('');
      
      // Calculate time differences
      if (nextRoiUpdate) {
        const timeUntilNextUpdate = nextRoiUpdate.getTime() - now.getTime();
        const minutesUntilNext = Math.floor(timeUntilNextUpdate / (1000 * 60));
        const secondsUntilNext = Math.floor((timeUntilNextUpdate % (1000 * 60)) / 1000);
        
        if (timeUntilNext > 0) {
          console.log(`⏰ Time until next update: ${minutesUntilNext}m ${secondsUntilNext}s`);
        } else {
          console.log(`⏰ Update overdue by: ${Math.abs(minutesUntilNext)}m ${Math.abs(secondsUntilNext)}s`);
        }
      }
      
      if (nextRoiCycleDate) {
        const timeUntilNextCycle = nextRoiCycleDate.getTime() - now.getTime();
        const hoursUntilNext = Math.floor(timeUntilNextCycle / (1000 * 60 * 60));
        const minutesUntilNext = Math.floor((timeUntilNextCycle % (1000 * 60 * 60)) / (1000 * 60));
        
        if (timeUntilNext > 0) {
          console.log(`🔄 Time until next 24-hour cycle: ${hoursUntilNext}h ${minutesUntilNext}m`);
        } else {
          console.log(`🔄 24-hour cycle overdue by: ${Math.abs(hoursUntilNext)}h ${Math.abs(minutesUntilNext)}m`);
        }
      }
      console.log('');
      
      // Determine if this investment should be processed
      const shouldBeProcessed = (needs24HourCycle || needsHourlyUpdate) && !lastUpdateTooRecent;
      
      if (shouldBeProcessed) {
        investmentsNeedingUpdates++;
        console.log('✅ INVESTMENT SHOULD BE PROCESSED BY CRON JOB');
        
        if (needs24HourCycle) {
          console.log('   🔄 Will process 24-hour ROI cycle');
        }
        
        if (needsHourlyUpdate) {
          console.log('   ⏰ Will process hourly ROI accumulation');
        }
      } else {
        if (lastUpdateTooRecent) {
          console.log('❌ INVESTMENT EXCLUDED: Updated too recently (within 2 minutes)');
        } else if (!needs24HourCycle && !needsHourlyUpdate) {
          console.log('❌ INVESTMENT EXCLUDED: No updates due yet');
        }
      }
      
      // Check for potential issues
      if (!nextRoiUpdate || !nextRoiCycleDate) {
        investmentsWithIssues++;
        console.log('⚠️  POTENTIAL ISSUE: Missing timestamp fields');
      }
      
      console.log('');
    }
    
    console.log('=' .repeat(80));
    console.log('🎯 DIAGNOSIS SUMMARY:');
    console.log(`   Total active investments: ${activeInvestments.length}`);
    console.log(`   Investments needing updates: ${investmentsNeedingUpdates}`);
    console.log(`   Investments with potential issues: ${investmentsWithIssues}`);
    console.log('');
    
    if (investmentsNeedingUpdates > 0) {
      console.log('✅ CRON JOB SHOULD BE PROCESSING INVESTMENTS');
      console.log('   If it\'s not working, the issue might be:');
      console.log('   1. Backend service not running');
      console.log('   2. Cron job not enabled');
      console.log('   3. Database connection issues');
      console.log('   4. Errors in the cron job execution');
    } else {
      console.log('❌ NO INVESTMENTS NEED UPDATES RIGHT NOW');
      console.log('   This could mean:');
      console.log('   1. All investments were recently updated');
      console.log('   2. Timestamps are set too far in the future');
      console.log('   3. There\'s an issue with the timestamp logic');
    }
    
  } catch (error) {
    console.error('❌ Error in diagnosis:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await diagnoseCronExecution();
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

module.exports = { diagnoseCronExecution };
