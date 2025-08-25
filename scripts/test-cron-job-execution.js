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

const Investment = mongoose.model('Investment', investmentSchema);

async function testCronJobExecution() {
  console.log('🧪 TESTING CRON JOB EXECUTION\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Current Time: ${now.toISOString()}\n`);
    
    // Get all active investments
    const activeInvestments = await Investment.find({
      status: 'active',
      endDate: { $gt: now }
    }).sort({ startDate: 1 });
    
    console.log(`📊 Found ${activeInvestments.length} active investments to test\n`);
    
    for (const investment of activeInvestments) {
      console.log('=' .repeat(60));
      console.log(`💰 INVESTMENT: ${investment._id}`);
      console.log('=' .repeat(60));
      
      const startDate = new Date(investment.startDate);
      const lastRoiUpdate = investment.lastRoiUpdate ? new Date(investment.lastRoiUpdate) : startDate;
      const nextRoiCycleDate = investment.nextRoiCycleDate ? new Date(investment.nextRoiCycleDate) : null;
      const nextRoiUpdate = investment.nextRoiUpdate ? new Date(investment.nextRoiUpdate) : null;
      
      // Calculate time differences
      const timeSinceStart = now.getTime() - startDate.getTime();
      const timeSinceLastUpdate = now.getTime() - lastRoiUpdate.getTime();
      const timeUntilNextCycle = nextRoiCycleDate ? nextRoiCycleDate.getTime() - now.getTime() : 0;
      const timeUntilNextUpdate = nextRoiUpdate ? nextRoiUpdate.getTime() - now.getTime() : 0;
      
      const daysSinceStart = Math.floor(timeSinceStart / (1000 * 60 * 60 * 24));
      const hoursSinceStart = Math.floor(timeSinceStart / (1000 * 60 * 60));
      const hoursSinceLastUpdate = Math.floor(timeSinceLastUpdate / (1000 * 60 * 60));
      const hoursUntilNextCycle = Math.floor(timeUntilNextCycle / (1000 * 60 * 60));
      const hoursUntilNextUpdate = Math.floor(timeUntilNextUpdate / (1000 * 60 * 60));
      
      console.log('📊 CURRENT STATE:');
      console.log(`   earnedAmount: ${investment.earnedAmount || 0}`);
      console.log(`   totalAccumulatedRoi: ${investment.totalAccumulatedRoi || 0}`);
      console.log(`   lastRoiUpdate: ${lastRoiUpdate.toISOString()}`);
      console.log(`   nextRoiCycleDate: ${nextRoiCycleDate ? nextRoiCycleDate.toISOString() : 'Not set'}`);
      console.log(`   nextRoiUpdate: ${nextRoiUpdate ? nextRoiUpdate.toISOString() : 'Not set'}`);
      console.log('');
      
      console.log('⏰ TIME ANALYSIS:');
      console.log(`   Days since start: ${daysSinceStart}`);
      console.log(`   Hours since start: ${hoursSinceStart}`);
      console.log(`   Hours since last update: ${hoursSinceLastUpdate}`);
      console.log(`   Hours until next cycle: ${hoursUntilNextCycle}`);
      console.log(`   Hours until next update: ${hoursUntilNextUpdate}`);
      console.log('');
      
      // Test the exact query logic from the cron job
      console.log('🔍 TESTING CRON JOB QUERY LOGIC:\n');
      
      // This is the exact query from updateInvestmentRoi cron job
      const cronJobQuery = {
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
              { lastRoiUpdate: { $lt: new Date(now.getTime() - 2 * 60 * 1000) } }
            ]
          }
        ]
      };
      
      console.log('   Cron Job Query:');
      console.log(`     Status: active`);
      console.log(`     End Date: > ${now.toISOString()}`);
      console.log(`     AND condition:`);
      console.log(`       OR: nextRoiCycleDate <= ${now.toISOString()} OR nextRoiUpdate <= ${now.toISOString()}`);
      console.log(`       OR: lastRoiUpdate doesn't exist OR lastRoiUpdate < ${new Date(now.getTime() - 2 * 60 * 1000).toISOString()}`);
      console.log('');
      
      // Test if this investment would be picked up by the cron job
      const wouldBePickedUp = await Investment.findOne({
        _id: investment._id,
        ...cronJobQuery
      });
      
      if (wouldBePickedUp) {
        console.log('✅ This investment WOULD be picked up by the cron job');
        
        // Check which condition triggered it
        const needs24HourCycle = nextRoiCycleDate && nextRoiCycleDate <= now;
        const needsHourlyUpdate = nextRoiUpdate && nextRoiUpdate <= now;
        const lastUpdateOld = !investment.lastRoiUpdate || investment.lastRoiUpdate < new Date(now.getTime() - 2 * 60 * 1000);
        
        console.log('   Triggered by:');
        if (needs24HourCycle) console.log(`     - 24-hour cycle due (nextRoiCycleDate: ${nextRoiCycleDate.toISOString()})`);
        if (needsHourlyUpdate) console.log(`     - Hourly update due (nextRoiUpdate: ${nextRoiUpdate.toISOString()})`);
        if (lastUpdateOld) console.log(`     - Last update old enough (lastRoiUpdate: ${lastRoiUpdate.toISOString()})`);
        
      } else {
        console.log('❌ This investment would NOT be picked up by the cron job');
        
        // Check why not
        const statusOk = investment.status === 'active';
        const endDateOk = investment.endDate > now;
        const cycleDateOk = nextRoiCycleDate && nextRoiCycleDate <= now;
        const updateDateOk = nextRoiUpdate && nextRoiUpdate <= now;
        const lastUpdateOk = !investment.lastRoiUpdate || investment.lastRoiUpdate < new Date(now.getTime() - 2 * 60 * 1000);
        
        console.log('   Reasons:');
        if (!statusOk) console.log(`     - Status not active (${investment.status})`);
        if (!endDateOk) console.log(`     - End date passed (${investment.endDate.toISOString()})`);
        if (!cycleDateOk) console.log(`     - 24-hour cycle not due (${nextRoiCycleDate ? nextRoiCycleDate.toISOString() : 'Not set'})`);
        if (!updateDateOk) console.log(`     - Hourly update not due (${nextRoiUpdate ? nextRoiUpdate.toISOString() : 'Not set'})`);
        if (!lastUpdateOk) console.log(`     - Last update too recent (${lastRoiUpdate.toISOString()})`);
      }
      
      console.log('');
    }
    
    // Test the full query to see how many investments would be processed
    console.log('🎯 TESTING FULL CRON JOB QUERY:\n');
    
    const investmentsToProcess = await Investment.find(cronJobQuery);
    console.log(`📊 Cron job would process ${investmentsToProcess.length} investments right now`);
    
    if (investmentsToProcess.length > 0) {
      console.log('   Investments that would be processed:');
      for (const inv of investmentsToProcess) {
        console.log(`     - ${inv._id} (${inv.amount} ${inv.currency})`);
      }
    }
    
    console.log('');
    console.log('=' .repeat(80));
    
  } catch (error) {
    console.error('❌ Error testing cron job execution:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await testCronJobExecution();
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

module.exports = { testCronJobExecution };
