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

async function fixMissingRoiTransactions() {
  console.log('🔧 FIXING MISSING ROI TRANSACTIONS\n');
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
    
    let totalFixed = 0;
    
    for (const investment of targetInvestments) {
      const user = investment.userId;
      const plan = investment.planId;
      
      if (!user || !plan) {
        console.log(`⚠️ Skipping investment ${investment._id} - missing user or plan data`);
        continue;
      }
      
      console.log('=' .repeat(60));
      console.log(`🔧 FIXING ROI TRANSACTIONS FOR: ${user.firstName} ${user.lastName}`);
      console.log('=' .repeat(60));
      
      const expectedDailyRoi = (investment.amount * investment.dailyRoi) / 100; // ₦3,350
      const currentTotal = investment.totalAccumulatedRoi || 0;
      
      console.log('📊 INVESTMENT DETAILS:');
      console.log(`   Investment ID: ${investment._id}`);
      console.log(`   Plan: ${plan.name}`);
      console.log(`   Expected Daily ROI: ₦${expectedDailyRoi.toFixed(4)}`);
      console.log(`   Current Total: ₦${currentTotal.toFixed(4)}`);
      console.log('');
      
      // Check existing ROI transactions
      const existingRoiTransactions = await Transaction.find({
        investmentId: investment._id,
        type: 'roi',
        status: 'success'
      });
      
      const totalFromTransactions = existingRoiTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const missingAmount = expectedDailyRoi - totalFromTransactions;
      
      console.log('💳 TRANSACTION ANALYSIS:');
      console.log(`   Existing ROI transactions: ${existingRoiTransactions.length}`);
      console.log(`   Total from transactions: ₦${totalFromTransactions.toFixed(4)}`);
      console.log(`   Missing amount: ₦${missingAmount.toFixed(4)}`);
      console.log('');
      
      if (missingAmount <= 0) {
        console.log(`✅ No missing ROI transactions for ${user.firstName} ${user.lastName}`);
        continue;
      }
      
      // Create the missing ROI transaction
      console.log('🔧 CREATING MISSING ROI TRANSACTION:');
      
      try {
        // Calculate when this ROI should have been paid (24 hours after start)
        const startDate = new Date(investment.startDate);
        const expectedPaymentDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        
        const missingTransaction = new Transaction({
          userId: investment.userId,
          type: 'roi',
          status: 'success',
          amount: missingAmount,
          currency: investment.currency,
          description: `24-Hour Cycle ROI payment for ${plan.name} investment`,
          reference: `ROI-ORIGINAL-${investment._id}-${Date.now()}`,
          investmentId: investment._id,
          planId: investment.planId,
          processedAt: expectedPaymentDate,
          isAutomated: true,
          createdAt: expectedPaymentDate,
          updatedAt: expectedPaymentDate
        });
        
        await missingTransaction.save();
        
        console.log(`   ✅ Created missing ROI transaction: ₦${missingAmount.toFixed(4)} ${investment.currency}`);
        console.log(`   ✅ Transaction ID: ${missingTransaction._id}`);
        console.log(`   ✅ Payment Date: ${expectedPaymentDate.toISOString()}`);
        totalFixed++;
        
      } catch (transactionError) {
        console.error(`   ❌ Failed to create missing ROI transaction for ${user.firstName} ${user.lastName}:`, transactionError);
      }
      
      console.log('');
    }
    
    console.log('=' .repeat(80));
    console.log(`🎯 MISSING ROI TRANSACTIONS FIXED!`);
    console.log(`   Total investments processed: ${targetInvestments.length}`);
    console.log(`   Total transactions created: ${totalFixed}`);
    console.log('=' .repeat(80));
    
    // Verify the fix
    console.log('\n🔍 VERIFYING THE FIX:\n');
    
    for (const investment of targetInvestments) {
      const user = investment.userId;
      if (!user) continue;
      
      const roiTransactions = await Transaction.find({
        investmentId: investment._id,
        type: 'roi',
        status: 'success'
      }).sort({ createdAt: -1 });
      
      const totalFromTransactions = roiTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const expectedDailyRoi = (investment.amount * investment.dailyRoi) / 100;
      
      console.log(`📊 ${user.firstName} ${user.lastName}:`);
      console.log(`   Total ROI transactions: ${roiTransactions.length}`);
      console.log(`   Total from transactions: ₦${totalFromTransactions.toFixed(4)}`);
      console.log(`   Expected daily ROI: ₦${expectedDailyRoi.toFixed(4)}`);
      console.log(`   Investment total: ₦${investment.totalAccumulatedRoi.toFixed(4)}`);
      
      if (Math.abs(totalFromTransactions - expectedDailyRoi) <= 0.01) {
        console.log(`   Status: ✅ FIXED - Transaction total matches expected ROI`);
      } else {
        console.log(`   Status: ❌ STILL MISMATCHED`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error fixing missing ROI transactions:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await fixMissingRoiTransactions();
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

module.exports = { fixMissingRoiTransactions };
