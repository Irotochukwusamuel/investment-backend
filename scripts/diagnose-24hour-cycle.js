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

async function diagnose24HourCycle() {
  console.log('🔍 DIAGNOSING 24-HOUR ROI CYCLE ISSUES\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Current Time: ${now.toISOString()}\n`);
    
    // Get all active investments
    const allActiveInvestments = await Investment.find({
      status: 'active',
      endDate: { $gt: now }
    }).sort({ startDate: 1 });
    
    console.log(`📊 Total Active Investments: ${allActiveInvestments.length}\n`);
    
    for (const investment of allActiveInvestments) {
      console.log('=' .repeat(60));
      console.log(`💰 INVESTMENT: ${investment._id}`);
      console.log('=' .repeat(60));
      
      const startDate = new Date(investment.startDate);
      const lastRoiUpdate = investment.lastRoiUpdate ? new Date(investment.lastRoiUpdate) : startDate;
      const nextRoiCycleDate = investment.nextRoiCycleDate ? new Date(investment.nextRoiCycleDate) : null;
      const nextRoiUpdate = investment.nextRoiUpdate ? new Date(investment.nextRoiUpdate) : null;
      
      // Calculate time differences
      const hoursSinceStart = Math.max(0, Math.floor((now - startDate) / (1000 * 60 * 60)));
      const hoursSinceLastUpdate = Math.max(0, Math.floor((now - lastRoiUpdate) / (1000 * 60 * 60)));
      const timeUntilNextCycle = nextRoiCycleDate ? (nextRoiCycleDate - now) / (1000 * 60 * 60) : null;
      const timeUntilNextUpdate = nextRoiUpdate ? (nextRoiUpdate - now) / (1000 * 60 * 60) : null;
      
      console.log('📊 BASIC INFO:');
      console.log(`   Amount: ${investment.amount.toLocaleString()} ${investment.currency}`);
      console.log(`   Daily ROI: ${investment.dailyRoi}%`);
      console.log(`   Status: ${investment.status}`);
      console.log(`   Start Date: ${startDate.toISOString()}`);
      console.log(`   End Date: ${investment.endDate.toISOString()}`);
      console.log('');
      
      console.log('⏰ TIME CALCULATIONS:');
      console.log(`   Hours since start: ${hoursSinceStart}`);
      console.log(`   Hours since last ROI update: ${hoursSinceLastUpdate}`);
      console.log(`   Time until next cycle: ${timeUntilNextCycle ? timeUntilNextCycle.toFixed(2) + ' hours' : 'Not set'}`);
      console.log(`   Time until next update: ${timeUntilNextUpdate ? timeUntilNextUpdate.toFixed(2) + ' hours' : 'Not set'}`);
      console.log('');
      
      console.log('📅 TIMESTAMP ANALYSIS:');
      console.log(`   Last ROI Update: ${lastRoiUpdate.toISOString()}`);
      console.log(`   Next ROI Cycle: ${nextRoiCycleDate ? nextRoiCycleDate.toISOString() : 'Not set'}`);
      console.log(`   Next ROI Update: ${nextRoiUpdate ? nextRoiUpdate.toISOString() : 'Not set'}`);
      console.log('');
      
      // Check if investment should be processed by 24-hour cycle
      const shouldProcess24Hour = nextRoiCycleDate && nextRoiCycleDate <= now;
      const shouldProcessHourly = nextRoiUpdate && nextRoiUpdate <= now;
      
      console.log('🔍 PROCESSING STATUS:');
      console.log(`   24-Hour Cycle Due: ${shouldProcess24Hour ? '✅ YES' : '❌ NO'}`);
      console.log(`   Hourly Update Due: ${shouldProcessHourly ? '✅ YES' : '❌ NO'}`);
      console.log('');
      
      // Check the exact query conditions
      console.log('🔍 QUERY CONDITIONS CHECK:');
      const condition1 = investment.status === 'active';
      const condition2 = investment.endDate > now;
      const condition3 = nextRoiCycleDate ? nextRoiCycleDate <= now : false;
      const condition4a = !investment.lastRoiUpdate;
      const condition4b = investment.lastRoiUpdate ? investment.lastRoiUpdate < new Date(Date.now() - 2 * 60 * 1000) : false;
      
      console.log(`   Status = 'active': ${condition1 ? '✅' : '❌'}`);
      console.log(`   endDate > now: ${condition2 ? '✅' : '❌'}`);
      console.log(`   nextRoiCycleDate <= now: ${condition3 ? '✅' : '❌'}`);
      console.log(`   lastRoiUpdate doesn't exist: ${condition4a ? '✅' : '❌'}`);
      console.log(`   lastRoiUpdate < (now - 2 minutes): ${condition4b ? '✅' : '❌'}`);
      console.log('');
      
      if (condition1 && condition2 && condition3 && (condition4a || condition4b)) {
        console.log('🎯 This investment SHOULD be found by the 24-hour cycle query!');
      } else {
        console.log('❌ This investment will NOT be found by the 24-hour cycle query because:');
        if (!condition1) console.log('   - Status is not active');
        if (!condition2) console.log('   - End date is in the past');
        if (!condition3) console.log('   - Next ROI cycle date is in the future');
        if (!condition4a && !condition4b) console.log('   - Last ROI update was less than 2 minutes ago');
      }
      
      console.log('');
    }
    
    // Summary
    console.log('=' .repeat(80));
    console.log('📋 SUMMARY OF ISSUES:');
    console.log('=' .repeat(80));
    
    const investmentsNeeding24Hour = allActiveInvestments.filter(inv => {
      const nextRoiCycleDate = inv.nextRoiCycleDate ? new Date(inv.nextRoiCycleDate) : null;
      return nextRoiCycleDate && nextRoiCycleDate <= now;
    });
    
    const investmentsNeedingHourly = allActiveInvestments.filter(inv => {
      const nextRoiUpdate = inv.nextRoiUpdate ? new Date(inv.nextRoiUpdate) : null;
      return nextRoiUpdate && nextRoiUpdate <= now;
    });
    
    console.log(`   Investments needing 24-hour cycle: ${investmentsNeeding24Hour.length}`);
    console.log(`   Investments needing hourly update: ${investmentsNeedingHourly.length}`);
    console.log(`   Total active investments: ${allActiveInvestments.length}`);
    
    if (investmentsNeeding24Hour.length === 0) {
      console.log('\n🚨 PROBLEM IDENTIFIED: No investments need 24-hour cycle processing!');
      console.log('   This suggests the nextRoiCycleDate logic is incorrect.');
      console.log('   The system should process investments every 24 hours, not wait for nextRoiCycleDate.');
    }
    
    if (investmentsNeedingHourly.length === 0) {
      console.log('\n🚨 PROBLEM IDENTIFIED: No investments need hourly processing!');
      console.log('   This suggests the nextRoiUpdate logic is incorrect.');
      console.log('   The system should process investments every hour, not wait for nextRoiUpdate.');
    }
    
  } catch (error) {
    console.error('❌ Error in diagnosis:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await diagnose24HourCycle();
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

module.exports = { diagnose24HourCycle };
