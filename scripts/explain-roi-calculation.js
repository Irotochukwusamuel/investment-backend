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

async function explainRoiCalculation() {
  console.log('🧮 EXPLAINING ROI CALCULATION STEP BY STEP\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Current Time: ${now.toISOString()}\n`);
    
    // Get the specific investment
    const investment = await Investment.findById('68a7038f46584963a14a6b03');
    
    if (!investment) {
      console.log('❌ Investment not found');
      return;
    }
    
    console.log('💰 INVESTMENT DETAILS:');
    console.log(`   ID: ${investment._id}`);
    console.log(`   Amount: ${investment.amount.toLocaleString()} ${investment.currency}`);
    console.log(`   Daily ROI: ${investment.dailyRoi}%`);
    console.log(`   Duration: ${investment.duration} days`);
    console.log(`   Start Date: ${investment.startDate.toISOString()}`);
    console.log(`   Last ROI Update: ${investment.lastRoiUpdate.toISOString()}`);
    console.log('');
    
    // Step 1: Calculate Daily ROI
    console.log('📊 STEP 1: CALCULATE DAILY ROI');
    const dailyRoiAmount = (investment.amount * investment.dailyRoi) / 100;
    console.log(`   Formula: (Amount × Daily ROI %) ÷ 100`);
    console.log(`   Calculation: (${investment.amount} × ${investment.dailyRoi}%) ÷ 100`);
    console.log(`   Result: ${dailyRoiAmount.toFixed(4)} ${investment.currency} per day`);
    console.log('');
    
    // Step 2: Calculate Hourly ROI
    console.log('📊 STEP 2: CALCULATE HOURLY ROI');
    const hourlyRoiAmount = dailyRoiAmount / 24;
    console.log(`   Formula: Daily ROI ÷ 24 hours`);
    console.log(`   Calculation: ${dailyRoiAmount.toFixed(4)} ÷ 24`);
    console.log(`   Result: ${hourlyRoiAmount.toFixed(4)} ${investment.currency} per hour`);
    console.log('');
    
    // Step 3: Calculate Minute ROI
    console.log('📊 STEP 3: CALCULATE MINUTE ROI');
    const minuteRoiAmount = hourlyRoiAmount / 60;
    console.log(`   Formula: Hourly ROI ÷ 60 minutes`);
    console.log(`   Calculation: ${hourlyRoiAmount.toFixed(4)} ÷ 60`);
    console.log(`   Result: ${minuteRoiAmount.toFixed(4)} ${investment.currency} per minute`);
    console.log('');
    
    // Step 4: Calculate Time Since Last Update
    console.log('📊 STEP 4: CALCULATE TIME SINCE LAST UPDATE');
    const lastUpdate = new Date(investment.lastRoiUpdate);
    const minutesSinceLastUpdate = Math.floor((now - lastUpdate) / (1000 * 60));
    const secondsSinceLastUpdate = Math.floor((now - lastUpdate) / 1000);
    
    console.log(`   Current Time: ${now.toISOString()}`);
    console.log(`   Last Update: ${lastUpdate.toISOString()}`);
    console.log(`   Time Difference: ${minutesSinceLastUpdate} minutes and ${secondsSinceLastUpdate % 60} seconds`);
    console.log(`   Total Seconds: ${secondsSinceLastUpdate}`);
    console.log('');
    
    // Step 5: Calculate Earned Amount
    console.log('📊 STEP 5: CALCULATE EARNED AMOUNT');
    const earnedAmount = minuteRoiAmount * minutesSinceLastUpdate;
    console.log(`   Formula: Minute ROI × Minutes Since Last Update`);
    console.log(`   Calculation: ${minuteRoiAmount.toFixed(4)} × ${minutesSinceLastUpdate}`);
    console.log(`   Result: ${earnedAmount.toFixed(4)} ${investment.currency}`);
    console.log('');
    
    // Step 6: Show Current Values
    console.log('📊 STEP 6: CURRENT VALUES IN DATABASE');
    console.log(`   earnedAmount: ${investment.earnedAmount} ${investment.currency}`);
    console.log(`   totalAccumulatedRoi: ${investment.totalAccumulatedRoi} ${investment.currency}`);
    console.log('');
    
    // Step 7: Explain Why This Amount
    console.log('💡 WHY ₦30.24?');
    console.log(`   • Your investment earns ${minuteRoiAmount.toFixed(4)} ${investment.currency} every minute`);
    console.log(`   • It's been ${minutesSinceLastUpdate} minutes since the last update`);
    console.log(`   • So: ${minuteRoiAmount.toFixed(4)} × ${minutesSinceLastUpdate} = ${earnedAmount.toFixed(4)} ${investment.currency}`);
    console.log('');
    console.log(`   This amount will continue to increase every minute until the next 24-hour cycle!`);
    console.log('');
    
    // Step 8: Show Real-time Example
    console.log('⏰ REAL-TIME EXAMPLE:');
    console.log(`   Right now: ${earnedAmount.toFixed(4)} ${investment.currency}`);
    console.log(`   In 1 minute: ${(earnedAmount + minuteRoiAmount).toFixed(4)} ${investment.currency}`);
    console.log(`   In 5 minutes: ${(earnedAmount + (minuteRoiAmount * 5)).toFixed(4)} ${investment.currency}`);
    console.log(`   In 1 hour: ${(earnedAmount + (minuteRoiAmount * 60)).toFixed(4)} ${investment.currency}`);
    console.log('');
    
    console.log('🎯 SUMMARY:');
    console.log(`   The ₦30.24 represents the ROI you've earned in the ${minutesSinceLastUpdate} minutes since your last update.`);
    console.log(`   This is your "Earned Amount" for the current 24-hour cycle.`);
    console.log(`   It will keep growing every minute until the cycle completes!`);
    
  } catch (error) {
    console.error('❌ Error explaining ROI calculation:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await explainRoiCalculation();
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

module.exports = { explainRoiCalculation };
