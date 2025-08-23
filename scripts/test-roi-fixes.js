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

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  investmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment' },
  type: String,
  amount: Number,
  currency: String,
  status: String,
  createdAt: Date
});

const Investment = mongoose.model('Investment', investmentSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

async function testRoiFixes() {
  console.log('🧪 Testing ROI fixes...\n');
  
  try {
    // Get all investments
    const investments = await Investment.find({
      status: { $in: ['active', 'completed'] }
    });
    
    console.log(`📊 Found ${investments.length} investments to test\n`);
    
    for (const investment of investments) {
      console.log(`💰 Investment: ${investment._id}`);
      console.log(`   Plan: ${investment.planId}`);
      console.log(`   Amount: ${investment.amount} ${investment.currency}`);
      console.log(`   Daily ROI: ${investment.dailyRoi}%`);
      console.log(`   Status: ${investment.status}`);
      console.log(`   Current earnedAmount: ${investment.earnedAmount || 0}`);
      console.log(`   Total accumulated ROI: ${investment.totalAccumulatedRoi || 0}`);
      console.log(`   Expected return: ${investment.expectedReturn || 0}`);
      
      // Calculate expected daily ROI
      const expectedDailyRoi = (investment.amount * investment.dailyRoi) / 100;
      console.log(`   Expected daily ROI: ${expectedDailyRoi.toFixed(4)} ${investment.currency}`);
      
      // Calculate expected total ROI based on duration
      const daysElapsed = Math.max(0, Math.floor((new Date() - new Date(investment.startDate)) / (1000 * 60 * 60 * 24)));
      const expectedTotalRoi = expectedDailyRoi * daysElapsed;
      console.log(`   Days elapsed: ${daysElapsed}`);
      console.log(`   Expected total ROI so far: ${expectedTotalRoi.toFixed(4)} ${investment.currency}`);
      
      // Check if earnedAmount is reasonable
      if (investment.earnedAmount > expectedTotalRoi * 1.1) {
        console.log(`   ⚠️  WARNING: earnedAmount (${investment.earnedAmount}) is higher than expected total ROI (${expectedTotalRoi.toFixed(4)})`);
      } else if (investment.earnedAmount < expectedTotalRoi * 0.9 && daysElapsed > 1) {
        console.log(`   ⚠️  WARNING: earnedAmount (${investment.earnedAmount}) is lower than expected total ROI (${expectedTotalRoi.toFixed(4)})`);
      } else {
        console.log(`   ✅ earnedAmount is within reasonable range`);
      }
      
      // Check if totalAccumulatedRoi is reasonable
      if (investment.totalAccumulatedRoi > expectedTotalRoi * 1.1) {
        console.log(`   ⚠️  WARNING: totalAccumulatedRoi (${investment.totalAccumulatedRoi}) is higher than expected total ROI (${expectedTotalRoi.toFixed(4)})`);
      } else if (investment.totalAccumulatedRoi < expectedTotalRoi * 0.9 && daysElapsed > 1) {
        console.log(`   ⚠️  WARNING: totalAccumulatedRoi (${investment.totalAccumulatedRoi}) is lower than expected total ROI (${expectedTotalRoi.toFixed(4)})`);
      } else {
        console.log(`   ✅ totalAccumulatedRoi is within reasonable range`);
      }
      
      console.log('');
    }
    
    // Test transaction history
    console.log('📋 Testing ROI transaction history...\n');
    
    for (const investment of investments) {
      const roiTransactions = await Transaction.find({
        investmentId: investment._id,
        type: 'roi',
        status: 'completed'
      });
      
      console.log(`💰 Investment ${investment._id}:`);
      console.log(`   ROI transactions found: ${roiTransactions.length}`);
      
      if (roiTransactions.length > 0) {
        const totalFromTransactions = roiTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        console.log(`   Total ROI from transactions: ${totalFromTransactions}`);
        console.log(`   Investment totalAccumulatedRoi: ${investment.totalAccumulatedRoi || 0}`);
        
        if (Math.abs(totalFromTransactions - (investment.totalAccumulatedRoi || 0)) < 0.01) {
          console.log(`   ✅ Transaction history matches investment total`);
        } else {
          console.log(`   ❌ MISMATCH: Transaction history doesn't match investment total`);
        }
      } else {
        console.log(`   ℹ️  No ROI transactions found (investment may be new or not yet paid out)`);
      }
      console.log('');
    }
    
    console.log('🎯 ROI fixes test completed!');
    
  } catch (error) {
    console.error('❌ Error in testRoiFixes:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await testRoiFixes();
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

module.exports = { testRoiFixes };
