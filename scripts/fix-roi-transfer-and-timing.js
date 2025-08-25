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
  createdAt: Date,
  processedAt: Date,
  description: String,
  reference: String
});

const Investment = mongoose.model('Investment', investmentSchema);
const Transaction = mongoose.model('transactions', transactionSchema);

async function fixRoiTransferAndTiming() {
  console.log('🔧 FIXING ROI TRANSFER AND TIMING ISSUES\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Current Time: ${now.toISOString()}\n`);
    
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
      const nextRoiCycleDate = investment.nextRoiCycleDate ? new Date(investment.nextRoiCycleDate) : null;
      
      // Calculate expected values
      const expectedDailyRoi = (investment.amount * investment.dailyRoi) / 100;
      const expectedHourlyRoi = expectedDailyRoi / 24;
      const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const expectedTotalRoi = expectedDailyRoi * daysSinceStart;
      
      console.log('📊 CURRENT STATE:');
      console.log(`   earnedAmount: ${investment.earnedAmount || 0}`);
      console.log(`   totalAccumulatedRoi: ${investment.totalAccumulatedRoi || 0}`);
      console.log(`   Expected Total ROI: ${expectedTotalRoi.toFixed(4)}`);
      console.log(`   lastRoiUpdate: ${lastRoiUpdate.toISOString()}`);
      console.log(`   nextRoiCycleDate: ${nextRoiCycleDate ? nextRoiCycleDate.toISOString() : 'Not set'}`);
      console.log('');
      
      // Check for missing ROI transactions
      const recentRoiTransactions = await Transaction.find({
        investmentId: investment._id,
        type: 'roi',
        status: 'success',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      });
      
      console.log(`📋 ROI Transactions in last 24h: ${recentRoiTransactions.length}`);
      if (recentRoiTransactions.length > 0) {
        recentRoiTransactions.forEach((tx, idx) => {
          const txDate = new Date(tx.createdAt);
          const timeAgo = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60));
          console.log(`   ${idx + 1}. ${tx.amount.toFixed(4)} ${tx.currency} - ${timeAgo}h ago - ${tx.description}`);
        });
      }
      console.log('');
      
      // Fix 1: Correct nextRoiCycleDate to be 24 hours from lastRoiUpdate
      const correctNextRoiCycleDate = new Date(lastRoiUpdate.getTime() + 24 * 60 * 60 * 1000);
      const needsCycleDateFix = !nextRoiCycleDate || Math.abs(nextRoiCycleDate.getTime() - correctNextRoiCycleDate.getTime()) > 60 * 1000; // 1 minute tolerance
      
      if (needsCycleDateFix) {
        console.log('🔧 FIXING nextRoiCycleDate:');
        console.log(`   Current: ${nextRoiCycleDate ? nextRoiCycleDate.toISOString() : 'Not set'}`);
        console.log(`   Correct: ${correctNextRoiCycleDate.toISOString()}`);
        
        await Investment.updateOne(
          { _id: investment._id },
          { $set: { nextRoiCycleDate: correctNextRoiCycleDate } }
        );
        
        console.log(`   ✅ Fixed nextRoiCycleDate`);
        totalFixed++;
      }
      
      // Fix 2: Create missing ROI transaction if earnedAmount was reset but no transaction exists
      if (investment.earnedAmount === 0 && recentRoiTransactions.length === 0) {
        // Calculate how much ROI should have been transferred
        const hoursSinceLastUpdate = Math.floor((now.getTime() - lastRoiUpdate.getTime()) / (1000 * 60 * 60));
        const expectedEarnedAmount = expectedHourlyRoi * hoursSinceLastUpdate;
        
        if (expectedEarnedAmount > 0) {
          console.log('🔧 CREATING MISSING ROI TRANSACTION:');
          console.log(`   Expected earned amount: ${expectedEarnedAmount.toFixed(4)} ${investment.currency}`);
          console.log(`   Hours since last update: ${hoursSinceLastUpdate}`);
          
          // Create the missing ROI transaction
          const transaction = new Transaction({
            userId: investment.userId,
            type: 'roi',
            status: 'success',
            amount: expectedEarnedAmount,
            currency: investment.currency,
            description: `24-Hour Cycle ROI payment for investment ${investment._id} (recovered)`,
            reference: `ROI-RECOVERED-${investment._id}-${Date.now()}`,
            investmentId: investment._id,
            planId: investment.planId,
            processedAt: new Date(),
            isAutomated: true,
          });
          
          await transaction.save();
          console.log(`   ✅ Created missing ROI transaction: ${expectedEarnedAmount.toFixed(4)} ${investment.currency}`);
          totalFixed++;
        }
      }
      
      console.log('');
    }
    
    console.log('=' .repeat(80));
    console.log(`🎯 ROI TRANSFER AND TIMING FIX COMPLETED!`);
    console.log(`   Total fixes applied: ${totalFixed}`);
    console.log(`   Total investments processed: ${activeInvestments.length}`);
    console.log('=' .repeat(80));
    
  } catch (error) {
    console.error('❌ Error fixing ROI transfer and timing:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await fixRoiTransferAndTiming();
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

module.exports = { fixRoiTransferAndTiming };
