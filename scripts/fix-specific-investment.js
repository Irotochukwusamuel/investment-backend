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

async function fixSpecificInvestment(investmentId) {
  console.log(`🔧 Fixing investment: ${investmentId}\n`);
  
  try {
    // Get the specific investment
    const investment = await Investment.findById(investmentId);
    if (!investment) {
      console.log('❌ Investment not found');
      return;
    }

    console.log('📊 Before Fix:');
    console.log(`   Earned Amount: ${investment.earnedAmount || 0}`);
    console.log(`   Total Accumulated ROI: ${investment.totalAccumulatedRoi || 0}`);
    console.log(`   Last ROI Update: ${investment.lastRoiUpdate ? investment.lastRoiUpdate.toISOString() : 'Not set'}`);
    console.log(`   Next ROI Update: ${investment.nextRoiUpdate ? investment.nextRoiUpdate.toISOString() : 'Not set'}`);
    console.log(`   Next ROI Cycle: ${investment.nextRoiCycleDate ? investment.nextRoiCycleDate.toISOString() : 'Not set'}`);
    console.log('');

    const now = new Date();
    const startDate = new Date(investment.startDate);
    const daysElapsed = Math.max(0, Math.floor((now - startDate) / (1000 * 60 * 60 * 24)));
    
    // Calculate expected ROI
    const expectedDailyRoi = (investment.amount * investment.dailyRoi) / 100;
    const expectedTotalRoi = expectedDailyRoi * daysElapsed;
    const expectedHourlyRoi = expectedDailyRoi / 24;
    
    console.log('📈 Expected Values:');
    console.log(`   Days Elapsed: ${daysElapsed}`);
    console.log(`   Expected Daily ROI: ${expectedDailyRoi.toFixed(4)} ${investment.currency}`);
    console.log(`   Expected Total ROI so far: ${expectedTotalRoi.toFixed(4)} ${investment.currency}`);
    console.log(`   Expected Hourly ROI: ${expectedHourlyRoi.toFixed(4)} ${investment.currency}`);
    console.log('');

    // Fix the investment
    const updates = {};
    
    // Fix earnedAmount - should be the expected total ROI so far
    if (investment.earnedAmount !== expectedTotalRoi) {
      updates.earnedAmount = expectedTotalRoi;
      console.log(`   🔧 Fixing earnedAmount: ${investment.earnedAmount} → ${expectedTotalRoi.toFixed(4)}`);
    }
    
    // Fix totalAccumulatedRoi - should include any previously accumulated ROI
    const currentTotalAccumulated = investment.totalAccumulatedRoi || 0;
    if (currentTotalAccumulated < expectedTotalRoi) {
      updates.totalAccumulatedRoi = expectedTotalRoi;
      console.log(`   🔧 Fixing totalAccumulatedRoi: ${currentTotalAccumulated} → ${expectedTotalRoi.toFixed(4)}`);
    }
    
    // Fix nextRoiUpdate - should be 1 hour from now
    const newNextRoiUpdate = new Date(now.getTime() + 60 * 60 * 1000);
    if (!investment.nextRoiUpdate || new Date(investment.nextRoiUpdate) <= now) {
      updates.nextRoiUpdate = newNextRoiUpdate;
      console.log(`   🔧 Fixing nextRoiUpdate: ${investment.nextRoiUpdate ? investment.nextRoiUpdate.toISOString() : 'Not set'} → ${newNextRoiUpdate.toISOString()}`);
    }
    
    // Fix nextRoiCycleDate - should be 24 hours from now
    const newNextRoiCycleDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (!investment.nextRoiCycleDate || new Date(investment.nextRoiCycleDate) <= now) {
      updates.nextRoiCycleDate = newNextRoiCycleDate;
      console.log(`   🔧 Fixing nextRoiCycleDate: ${investment.nextRoiCycleDate ? investment.nextRoiCycleDate.toISOString() : 'Not set'} → ${newNextRoiCycleDate.toISOString()}`);
    }
    
    // Fix lastRoiUpdate - should be now
    updates.lastRoiUpdate = now;
    console.log(`   🔧 Updating lastRoiUpdate: ${investment.lastRoiUpdate ? investment.lastRoiUpdate.toISOString() : 'Not set'} → ${now.toISOString()}`);
    
    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      await Investment.updateOne(
        { _id: investment._id },
        { $set: updates }
      );
      console.log('   ✅ Investment updated successfully');
    } else {
      console.log('   ℹ️  No updates needed');
    }
    
    // Verify the fix
    console.log('\n📊 After Fix:');
    const updatedInvestment = await Investment.findById(investmentId);
    console.log(`   Earned Amount: ${updatedInvestment.earnedAmount || 0}`);
    console.log(`   Total Accumulated ROI: ${updatedInvestment.totalAccumulatedRoi || 0}`);
    console.log(`   Last ROI Update: ${updatedInvestment.lastRoiUpdate ? updatedInvestment.lastRoiUpdate.toISOString() : 'Not set'}`);
    console.log(`   Next ROI Update: ${updatedInvestment.nextRoiUpdate ? updatedInvestment.nextRoiUpdate.toISOString() : 'Not set'}`);
    console.log(`   Next ROI Cycle: ${updatedInvestment.nextRoiCycleDate ? updatedInvestment.nextRoiCycleDate.toISOString() : 'Not set'}`);
    
    // Calculate countdown
    const nextRoiUpdate = new Date(updatedInvestment.nextRoiUpdate);
    const timeToNext = nextRoiUpdate.getTime() - now.getTime();
    const minutesToNext = Math.floor(timeToNext / (1000 * 60));
    const secondsToNext = Math.floor((timeToNext % (1000 * 60)) / 1000);
    
    console.log(`\n⏰ Countdown: ${minutesToNext}m ${secondsToNext}s until next ROI update`);
    
  } catch (error) {
    console.error('❌ Error fixing investment:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await fixSpecificInvestment('68a7038f46584963a14a6b03');
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

module.exports = { fixSpecificInvestment };
