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

async function fixHourlyRoiLogic() {
  console.log('🔧 FIXING HOURLY ROI LOGIC - CORRECTING MINUTE-BASED CALCULATIONS\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Fix Time: ${now.toISOString()}\n`);
    
    // Get all active investments
    const activeInvestments = await Investment.find({
      status: 'active',
      endDate: { $gt: now }
    }).sort({ startDate: 1 });
    
    console.log(`📊 Found ${activeInvestments.length} active investments to fix\n`);
    
    let totalFixed = 0;
    
    for (const investment of activeInvestments) {
      console.log('=' .repeat(60));
      console.log(`💰 INVESTMENT: ${investment._id}`);
      console.log('=' .repeat(60));
      
      const startDate = new Date(investment.startDate);
      const lastRoiUpdate = investment.lastRoiUpdate ? new Date(investment.lastRoiUpdate) : startDate;
      
      // Calculate time with HOUR precision (not minute)
      const hoursSinceStart = Math.max(0, Math.floor((now - startDate) / (1000 * 60 * 60)));
      const hoursSinceLastUpdate = Math.max(0, Math.floor((now - lastRoiUpdate) / (1000 * 60 * 60)));
      
      // Calculate ROI with HOUR precision
      const expectedDailyRoi = (investment.amount * investment.dailyRoi) / 100;
      const expectedHourlyRoi = expectedDailyRoi / 24;
      
      // Calculate expected values based on HOURS (not minutes)
      const expectedTotalRoi = expectedHourlyRoi * hoursSinceStart;
      const expectedEarnedAmount = expectedHourlyRoi * hoursSinceLastUpdate;
      
      console.log('📊 CURRENT VALUES (INCORRECT - MINUTE-BASED):');
      console.log(`   earnedAmount: ${investment.earnedAmount || 0}`);
      console.log(`   totalAccumulatedRoi: ${investment.totalAccumulatedRoi || 0}`);
      console.log(`   Hours since start: ${hoursSinceStart}`);
      console.log(`   Hours since last update: ${hoursSinceLastUpdate}`);
      console.log('');
      
      console.log('📈 CORRECT VALUES (HOURLY-BASED):');
      console.log(`   Expected earnedAmount: ${expectedEarnedAmount.toFixed(4)}`);
      console.log(`   Expected totalAccumulatedRoi: ${expectedTotalRoi.toFixed(4)}`);
      console.log(`   Daily ROI: ${expectedDailyRoi.toFixed(4)} ${investment.currency}`);
      console.log(`   Hourly ROI: ${expectedHourlyRoi.toFixed(4)} ${investment.currency}`);
      console.log('');
      
      // Calculate deviations
      const earnedAmountDeviation = Math.abs((investment.earnedAmount || 0) - expectedEarnedAmount);
      const totalRoiDeviation = Math.abs((investment.totalAccumulatedRoi || 0) - expectedTotalRoi);
      
      console.log('🔍 DEVIATIONS:');
      console.log(`   earnedAmount deviation: ${earnedAmountDeviation.toFixed(4)} ${investment.currency}`);
      console.log(`   totalAccumulatedRoi deviation: ${totalRoiDeviation.toFixed(4)} ${investment.currency}`);
      console.log('');
      
      // Determine if fix is needed
      const needsEarnedAmountFix = earnedAmountDeviation > 0.01;
      const needsTotalRoiFix = totalRoiDeviation > 0.01;
      
      if (needsEarnedAmountFix || needsTotalRoiFix) {
        console.log('🔧 APPLYING HOURLY-BASED FIXES:');
        
        const updates = {};
        
        if (needsEarnedAmountFix) {
          updates.earnedAmount = expectedEarnedAmount;
          console.log(`   ✅ Fixed earnedAmount: ${investment.earnedAmount || 0} → ${expectedEarnedAmount.toFixed(4)} (HOURLY-BASED)`);
        }
        
        if (needsTotalRoiFix) {
          updates.totalAccumulatedRoi = expectedTotalRoi;
          console.log(`   ✅ Fixed totalAccumulatedRoi: ${investment.totalAccumulatedRoi || 0} → ${expectedTotalRoi.toFixed(4)} (HOURLY-BASED)`);
        }
        
        // Update the investment
        await Investment.updateOne(
          { _id: investment._id },
          { $set: updates }
        );
        
        totalFixed++;
        console.log(`   🎯 Investment ${investment._id} updated to HOURLY-BASED calculations`);
      } else {
        console.log('✅ No fixes needed - values are already hourly-based');
      }
      
      console.log('');
    }
    
    console.log('=' .repeat(80));
    console.log(`🎯 HOURLY ROI LOGIC FIX COMPLETED!`);
    console.log(`   Total investments fixed: ${totalFixed}`);
    console.log(`   Total investments processed: ${activeInvestments.length}`);
    console.log(`   All calculations now use HOURLY precision instead of MINUTE precision`);
    console.log('=' .repeat(80));
    
  } catch (error) {
    console.error('❌ Error in hourly ROI logic fix:', error);
  }
}

async function verifyHourlyFix() {
  console.log('\n🧪 VERIFYING HOURLY-BASED CALCULATIONS...\n');
  
  try {
    const activeInvestments = await Investment.find({
      status: 'active'
    });
    
    let hourlyBasedCount = 0;
    let totalCount = 0;
    
    for (const investment of activeInvestments) {
      totalCount++;
      console.log(`💰 Investment: ${investment._id}`);
      
      const now = new Date();
      const startDate = new Date(investment.startDate);
      const lastRoiUpdate = investment.lastRoiUpdate ? new Date(investment.lastRoiUpdate) : startDate;
      
      const hoursSinceStart = Math.max(0, Math.floor((now - startDate) / (1000 * 60 * 60)));
      const hoursSinceLastUpdate = Math.max(0, Math.floor((now - lastRoiUpdate) / (1000 * 60 * 60)));
      
      const expectedDailyRoi = (investment.amount * investment.dailyRoi) / 100;
      const expectedHourlyRoi = expectedDailyRoi / 24;
      
      const expectedTotalRoi = expectedHourlyRoi * hoursSinceStart;
      const expectedEarnedAmount = expectedHourlyRoi * hoursSinceLastUpdate;
      
      const earnedAmountDeviation = Math.abs((investment.earnedAmount || 0) - expectedEarnedAmount);
      const totalRoiDeviation = Math.abs((investment.totalAccumulatedRoi || 0) - expectedTotalRoi);
      
      const isHourlyBased = earnedAmountDeviation < 0.01 && totalRoiDeviation < 0.01;
      
      if (isHourlyBased) {
        hourlyBasedCount++;
        console.log(`   ✅ HOURLY-BASED - earnedAmount: ${investment.earnedAmount?.toFixed(4) || 0}, totalAccumulatedRoi: ${investment.totalAccumulatedRoi?.toFixed(4) || 0}`);
      } else {
        console.log(`   ❌ NOT HOURLY-BASED - earnedAmount: ${investment.earnedAmount?.toFixed(4) || 0} (should be ${expectedEarnedAmount.toFixed(4)}), totalAccumulatedRoi: ${investment.totalAccumulatedRoi?.toFixed(4) || 0} (should be ${expectedTotalRoi.toFixed(4)})`);
      }
      console.log('');
    }
    
    console.log(`🎯 VERIFICATION COMPLETED: ${hourlyBasedCount}/${totalCount} investments use HOURLY-BASED calculations`);
    
  } catch (error) {
    console.error('❌ Error verifying hourly fix:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await fixHourlyRoiLogic();
    await verifyHourlyFix();
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

module.exports = { fixHourlyRoiLogic, verifyHourlyFix };
