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

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: String,
  status: String,
  amount: Number,
  currency: String,
  description: String,
  reference: String,
  investmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment' },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'InvestmentPlan' },
  processedAt: Date,
  isAutomated: Boolean,
  createdAt: Date,
  updatedAt: Date
});

// User Schema
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String
});

// Investment Plan Schema
const investmentPlanSchema = new mongoose.Schema({
  name: String,
  dailyRoi: Number,
  duration: Number
});

const Investment = mongoose.model('Investment', investmentSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const User = mongoose.model('User', userSchema);
const InvestmentPlan = mongoose.model('InvestmentPlan', investmentPlanSchema);

async function verifyRoiHistory() {
  console.log('🔍 VERIFYING ROI HISTORY\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Current Time: ${now.toISOString()}\n`);
    
    // Find all investments with ₦50,000 and 6.7% ROI
    const targetInvestments = await Investment.find({
      amount: 50000,
      dailyRoi: 6.7,
      status: 'active'
    }).populate('userId', 'firstName lastName email').populate('planId', 'name');
    
    console.log(`📊 Found ${targetInvestments.length} target investments\n`);
    
    for (const investment of targetInvestments) {
      const user = investment.userId;
      const plan = investment.planId;
      
      if (!user || !plan) {
        console.log(`⚠️ Skipping investment ${investment._id} - missing user or plan data`);
        continue;
      }
      
      console.log('=' .repeat(60));
      console.log(`🔍 VERIFYING ROI HISTORY FOR: ${user.firstName} ${user.lastName}`);
      console.log('=' .repeat(60));
      
      console.log('📊 INVESTMENT DETAILS:');
      console.log(`   Investment ID: ${investment._id}`);
      console.log(`   Plan: ${plan.name}`);
      console.log(`   Amount: ₦${investment.amount.toLocaleString()}`);
      console.log(`   Daily ROI: ${investment.dailyRoi}%`);
      console.log(`   Total Accumulated ROI: ₦${investment.totalAccumulatedRoi.toFixed(4)}`);
      console.log(`   Expected Daily ROI: ₦${(investment.amount * investment.dailyRoi / 100).toFixed(4)}`);
      console.log('');
      
      // Check for ROI transactions
      console.log('💳 ROI TRANSACTION HISTORY:');
      
      const roiTransactions = await Transaction.find({
        investmentId: investment._id,
        type: 'roi',
        status: 'success'
      }).sort({ createdAt: -1 });
      
      if (roiTransactions.length === 0) {
        console.log(`   ❌ NO ROI TRANSACTIONS FOUND for investment ${investment._id}`);
        
        // Check if there should be transactions based on totalAccumulatedRoi
        const expectedDailyRoi = (investment.amount * investment.dailyRoi) / 100;
        if (investment.totalAccumulatedRoi >= expectedDailyRoi) {
          console.log(`   ⚠️ Investment has ₦${investment.totalAccumulatedRoi.toFixed(4)} total ROI but no transactions!`);
          console.log(`   🔧 This suggests the ROI was recovered but transaction records are missing.`);
        }
      } else {
        console.log(`   ✅ Found ${roiTransactions.length} ROI transactions:`);
        
        let totalRoiFromTransactions = 0;
        
        for (const tx of roiTransactions) {
          const txDate = new Date(tx.createdAt);
          const timeAgo = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
          const hoursAgo = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60));
          
          console.log(`      📋 Transaction: ${tx._id}`);
          console.log(`         Amount: ₦${tx.amount.toFixed(4)} ${tx.currency}`);
          console.log(`         Description: ${tx.description || 'No description'}`);
          console.log(`         Reference: ${tx.reference || 'No reference'}`);
          console.log(`         Created: ${txDate.toISOString()} (${timeAgo}d ${hoursAgo % 24}h ago)`);
          console.log(`         Is Automated: ${tx.isAutomated || false}`);
          
          totalRoiFromTransactions += tx.amount;
        }
        
        console.log(`   📊 Total ROI from transactions: ₦${totalRoiFromTransactions.toFixed(4)}`);
        console.log(`   📊 Investment totalAccumulatedRoi: ₦${investment.totalAccumulatedRoi.toFixed(4)}`);
        
        if (Math.abs(totalRoiFromTransactions - investment.totalAccumulatedRoi) > 0.01) {
          console.log(`   ⚠️ MISMATCH: Transaction total (₦${totalRoiFromTransactions.toFixed(4)}) != Investment total (₦${investment.totalAccumulatedRoi.toFixed(4)})`);
        } else {
          console.log(`   ✅ MATCH: Transaction total matches investment total`);
        }
      }
      
      // Check for any other transaction types
      console.log('\n💳 OTHER TRANSACTION TYPES:');
      
      const allTransactions = await Transaction.find({
        investmentId: investment._id
      }).sort({ createdAt: -1 });
      
      const otherTransactions = allTransactions.filter(tx => tx.type !== 'roi');
      
      if (otherTransactions.length === 0) {
        console.log(`   ℹ️ No other transaction types found for this investment`);
      } else {
        console.log(`   📋 Found ${otherTransactions.length} other transactions:`);
        
        for (const tx of otherTransactions) {
          const txDate = new Date(tx.createdAt);
          const timeAgo = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
          
          console.log(`      - ${tx.type.toUpperCase()}: ₦${tx.amount.toFixed(4)} ${tx.currency} (${timeAgo} days ago)`);
        }
      }
      
      console.log('');
    }
    
    // Summary of all ROI transactions
    console.log('=' .repeat(80));
    console.log('📊 OVERALL ROI TRANSACTION SUMMARY:\n');
    
    const allRoiTransactions = await Transaction.find({
      type: 'roi',
      status: 'success'
    }).sort({ createdAt: -1 });
    
    console.log(`Total ROI transactions in system: ${allRoiTransactions.length}`);
    
    if (allRoiTransactions.length > 0) {
      const totalRoiAmount = allRoiTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const automatedCount = allRoiTransactions.filter(tx => tx.isAutomated).length;
      const manualCount = allRoiTransactions.filter(tx => !tx.isAutomated).length;
      
      console.log(`Total ROI amount: ₦${totalRoiAmount.toFixed(4)}`);
      console.log(`Automated transactions: ${automatedCount}`);
      console.log(`Manual transactions: ${manualCount}`);
      
      // Group by currency
      const nairaTransactions = allRoiTransactions.filter(tx => tx.currency === 'naira');
      const usdtTransactions = allRoiTransactions.filter(tx => tx.currency === 'usdt');
      
      if (nairaTransactions.length > 0) {
        const nairaTotal = nairaTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        console.log(`Naira ROI transactions: ${nairaTransactions.length} (₦${nairaTotal.toFixed(4)})`);
      }
      
      if (usdtTransactions.length > 0) {
        const usdtTotal = usdtTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        console.log(`USDT ROI transactions: ${usdtTransactions.length} (${usdtTotal.toFixed(4)} USDT)`);
      }
    }
    
    console.log('=' .repeat(80));
    
  } catch (error) {
    console.error('❌ Error verifying ROI history:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await verifyRoiHistory();
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

module.exports = { verifyRoiHistory };
