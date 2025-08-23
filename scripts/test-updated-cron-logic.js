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

async function testUpdatedCronLogic() {
  console.log('🧪 TESTING UPDATED CRON JOB LOGIC\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Current Time: ${now.toISOString()}\n`);
    
    // Test the exact query logic from the updated cron job
    console.log('🔍 TESTING CRON JOB QUERY LOGIC:\n');
    
    // First, let's see all active investments
    const allActiveInvestments = await Investment.find({
      status: 'active',
      endDate: { $gt: now }
    });
    
    console.log(`📊 Total Active Investments: ${allActiveInvestments.length}\n`);
    
    for (const investment of allActiveInvestments) {
      console.log(`💰 Investment: ${investment._id}`);
      console.log(`   Status: ${investment.status}`);
      console.log(`   End Date: ${investment.endDate.toISOString()}`);
      console.log(`   Next ROI Cycle: ${investment.nextRoiCycleDate ? investment.nextRoiCycleDate.toISOString() : 'Not set'}`);
      console.log(`   Next ROI Update: ${investment.nextRoiUpdate ? investment.nextRoiUpdate.toISOString() : 'Not set'}`);
      console.log(`   Last ROI Update: ${investment.lastRoiUpdate ? investment.lastRoiUpdate.toISOString() : 'Not set'}`);
      console.log('');
    }
    
    // Now test the exact query from the cron job
    console.log('🔍 TESTING THE EXACT CRON JOB QUERY:\n');
    
    const cronJobQuery = {
      status: 'active',
      endDate: { $gt: now },
      $and: [
        // Either 24-hour cycle is due OR hourly ROI accumulation is due
        {
          $or: [
            { nextRoiCycleDate: { $lte: now } },
            { nextRoiUpdate: { $lte: now } }
          ]
        },
        // AND prevent processing investments that were updated in the last 2 minutes
        {
          $or: [
            { lastRoiUpdate: { $exists: false } },
            { lastRoiUpdate: { $lt: new Date(now.getTime() - 2 * 60 * 1000) } }
          ]
        }
      ]
    };
    
    console.log('📋 Query being tested:');
    console.log(JSON.stringify(cronJobQuery, null, 2));
    console.log('');
    
    const investmentsNeedingUpdates = await Investment.find(cronJobQuery);
    
    console.log(`🎯 Investments Found by Cron Job: ${investmentsNeedingUpdates.length}\n`);
    
    if (investmentsNeedingUpdates.length > 0) {
      console.log('✅ CRON JOB WILL PROCESS THESE INVESTMENTS:\n');
      
      for (const investment of investmentsNeedingUpdates) {
        const needs24HourCycle = investment.nextRoiCycleDate && investment.nextRoiCycleDate <= now;
        const needsHourlyUpdate = investment.nextRoiUpdate && investment.nextRoiUpdate <= now;
        
        console.log(`💰 Investment: ${investment._id}`);
        console.log(`   Needs 24-hour cycle: ${needs24HourCycle ? 'YES' : 'NO'}`);
        console.log(`   Needs hourly update: ${needsHourlyUpdate ? 'YES' : 'NO'}`);
        
        if (needs24HourCycle) {
          console.log(`   🔄 Will process 24-hour ROI cycle`);
        }
        
        if (needsHourlyUpdate) {
          console.log(`   ⏰ Will process hourly ROI accumulation`);
        }
        
        console.log('');
      }
    } else {
      console.log('❌ CRON JOB FOUND NO INVESTMENTS TO PROCESS\n');
      
      // Let's debug why no investments were found
      console.log('🔍 DEBUGGING WHY NO INVESTMENTS WERE FOUND:\n');
      
      for (const investment of allActiveInvestments) {
        console.log(`💰 Investment: ${investment._id}`);
        
        const nextRoiCycleDue = investment.nextRoiCycleDate && investment.nextRoiCycleDate <= now;
        const nextRoiUpdateDue = investment.nextRoiUpdate && investment.nextRoiUpdate <= now;
        const lastUpdateTooRecent = investment.lastRoiUpdate && investment.lastRoiUpdate > new Date(now.getTime() - 2 * 60 * 1000);
        
        console.log(`   Next ROI Cycle Due: ${nextRoiCycleDue ? 'YES' : 'NO'} (${investment.nextRoiCycleDate ? investment.nextRoiCycleDate.toISOString() : 'Not set'})`);
        console.log(`   Next ROI Update Due: ${nextRoiUpdateDue ? 'YES' : 'NO'} (${investment.nextRoiUpdate ? investment.nextRoiUpdate.toISOString() : 'Not set'})`);
        console.log(`   Last Update Too Recent: ${lastUpdateTooRecent ? 'YES' : 'NO'} (${investment.lastRoiUpdate ? investment.lastRoiUpdate.toISOString() : 'Not set'})`);
        
        if (!nextRoiCycleDue && !nextRoiUpdateDue) {
          console.log(`   ❌ Investment excluded: Neither 24-hour cycle nor hourly update is due`);
        }
        
        if (lastUpdateTooRecent) {
          console.log(`   ❌ Investment excluded: Updated too recently (within 2 minutes)`);
        }
        
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing cron job logic:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await testUpdatedCronLogic();
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

module.exports = { testUpdatedCronLogic };
