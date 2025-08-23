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

async function fixEarnedAmountLogic() {
  console.log('🔧 Fixing Earned Amount Logic\n');
  
  try {
    const now = new Date();
    
    // Get all active investments
    const activeInvestments = await Investment.find({
      status: 'active',
      endDate: { $gt: now }
    });
    
    console.log(`📊 Found ${activeInvestments.length} active investments to fix\n`);
    
    for (const investment of activeInvestments) {
      console.log(`💰 Processing investment: ${investment._id}`);
      
      const startDate = new Date(investment.startDate);
      const daysElapsed = Math.max(0, Math.floor((now - startDate) / (1000 * 60 * 60 * 24)));
      const lastRoiUpdate = investment.lastRoiUpdate ? new Date(investment.lastRoiUpdate) : startDate;
      const hoursSinceLastUpdate = Math.max(0, Math.floor((now - lastRoiUpdate) / (1000 * 60 * 60)));
      
      // Calculate expected values
      const expectedDailyRoi = (investment.amount * investment.dailyRoi) / 100;
      const expectedTotalRoi = expectedDailyRoi * daysElapsed;
      const expectedHourlyRoi = expectedDailyRoi / 24;
      
      console.log(`   Days elapsed: ${daysElapsed}`);
      console.log(`   Hours since last update: ${hoursSinceLastUpdate}`);
      console.log(`   Expected daily ROI: ${expectedDailyRoi.toFixed(4)} ${investment.currency}`);
      console.log(`   Expected total ROI so far: ${expectedTotalRoi.toFixed(4)} ${investment.currency}`);
      console.log(`   Expected hourly ROI: ${expectedHourlyRoi.toFixed(4)} ${investment.currency}`);
      
      // Current values
      console.log(`   Current earnedAmount: ${investment.earnedAmount || 0}`);
      console.log(`   Current totalAccumulatedRoi: ${investment.totalAccumulatedRoi || 0}`);
      
      const updates = {};
      
      // Fix earnedAmount: Should be the ROI accumulated since the last update
      // This represents what's currently accumulating and will be paid out in the next cycle
      const newEarnedAmount = expectedHourlyRoi * hoursSinceLastUpdate;
      if (Math.abs((investment.earnedAmount || 0) - newEarnedAmount) > 0.01) {
        updates.earnedAmount = newEarnedAmount;
        console.log(`   🔧 Fixing earnedAmount: ${investment.earnedAmount || 0} → ${newEarnedAmount.toFixed(4)}`);
      }
      
      // Fix totalAccumulatedRoi: Should be the total ROI earned since investment start
      // This represents the historical total and should never decrease
      if ((investment.totalAccumulatedRoi || 0) < expectedTotalRoi) {
        updates.totalAccumulatedRoi = expectedTotalRoi;
        console.log(`   🔧 Fixing totalAccumulatedRoi: ${investment.totalAccumulatedRoi || 0} → ${expectedTotalRoi.toFixed(4)}`);
      }
      
      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await Investment.updateOne(
          { _id: investment._id },
          { $set: updates }
        );
        console.log(`   ✅ Investment updated successfully`);
      } else {
        console.log(`   ℹ️  No updates needed`);
      }
      
      console.log('');
    }
    
    console.log('🎯 Earned amount logic fix completed!');
    
  } catch (error) {
    console.error('❌ Error in fixEarnedAmountLogic:', error);
  }
}

async function verifyFix() {
  console.log('\n🧪 Verifying the fix...\n');
  
  try {
    const activeInvestments = await Investment.find({
      status: 'active'
    });
    
    for (const investment of activeInvestments) {
      console.log(`💰 Investment: ${investment._id}`);
      console.log(`   Earned Amount: ${investment.earnedAmount || 0} (current cycle accumulation)`);
      console.log(`   Total Earnings: ${investment.totalAccumulatedRoi || 0} (total since start)`);
      
      if (investment.earnedAmount !== investment.totalAccumulatedRoi) {
        console.log(`   ✅ Fields are now properly differentiated`);
      } else {
        console.log(`   ❌ Fields still have the same value`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error verifying fix:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await fixEarnedAmountLogic();
    await verifyFix();
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

module.exports = { fixEarnedAmountLogic, verifyFix };
