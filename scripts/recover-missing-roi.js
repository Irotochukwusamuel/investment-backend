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

// Wallet Schema
const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: String,
  nairaBalance: { type: Number, default: 0 },
  usdtBalance: { type: Number, default: 0 },
  totalDeposits: { type: Number, default: 0 },
  totalWithdrawals: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  totalBonuses: { type: Number, default: 0 },
  totalReferralEarnings: { type: Number, default: 0 }
});

const Investment = mongoose.model('Investment', investmentSchema);
const Wallet = mongoose.model('Wallet', walletSchema);

async function recoverMissingRoi() {
  console.log('🔧 RECOVERING MISSING ROI\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Current Time: ${now.toISOString()}\n`);
    
    // Find all investments with ₦50,000 and 6.7% ROI that need recovery
    const targetInvestments = await Investment.find({
      amount: 50000,
      dailyRoi: 6.7,
      status: 'active'
    });
    
    console.log(`📊 Found ${targetInvestments.length} investments that need ROI recovery\n`);
    
    let totalRecovered = 0;
    
    for (const investment of targetInvestments) {
      console.log('=' .repeat(60));
      console.log(`💰 RECOVERING ROI FOR: Investment ID ${investment._id}`);
      console.log('=' .repeat(60));
      
      const startDate = new Date(investment.startDate);
      const expectedDailyRoi = (investment.amount * investment.dailyRoi) / 100; // ₦3,350
      const expectedHourlyRoi = expectedDailyRoi / 24; // ₦139.5833 per hour
      
      // Calculate what the total should be after 1 day
      const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const expectedTotalForTime = expectedDailyRoi * daysSinceStart;
      const actualTotal = investment.totalAccumulatedRoi || 0;
      const missingRoi = expectedTotalForTime - actualTotal;
      
      console.log('📊 CURRENT STATE:');
      console.log(`   Expected total for ${daysSinceStart} days: ₦${expectedTotalForTime.toFixed(4)}`);
      console.log(`   Actual total: ₦${actualTotal.toFixed(4)}`);
      console.log(`   Missing ROI: ₦${missingRoi.toFixed(4)}`);
      console.log('');
      
      if (missingRoi <= 0) {
        console.log('✅ No ROI recovery needed for this investment');
        continue;
      }
      
      // Step 1: Update the investment's totalAccumulatedRoi
      console.log('🔧 STEP 1: UPDATING INVESTMENT ROI');
      
      const newTotalAccumulatedRoi = actualTotal + missingRoi;
      
      await Investment.updateOne(
        { _id: investment._id },
        { 
          $set: { 
            totalAccumulatedRoi: newTotalAccumulatedRoi,
            lastRoiUpdate: now
          }
        }
      );
      
      console.log(`   ✅ Updated totalAccumulatedRoi: ${actualTotal.toFixed(4)} → ${newTotalAccumulatedRoi.toFixed(4)}`);
      
      // Step 2: Update user's wallet
      console.log('🔧 STEP 2: UPDATING USER WALLET');
      
      const userWallet = await Wallet.findOne({
        userId: investment.userId,
        type: 'main'
      });
      
      if (!userWallet) {
        console.log('   ❌ User wallet not found - cannot update wallet balance');
        continue;
      }
      
      const oldNairaBalance = userWallet.nairaBalance;
      const oldTotalEarnings = userWallet.totalEarnings;
      
      // Update wallet balance
      userWallet.nairaBalance += missingRoi;
      userWallet.totalEarnings += missingRoi;
      userWallet.lastTransactionDate = now;
      await userWallet.save();
      
      console.log(`   ✅ Updated wallet balance: ₦${oldNairaBalance.toFixed(4)} → ₦${userWallet.nairaBalance.toFixed(4)}`);
      console.log(`   ✅ Updated total earnings: ₦${oldTotalEarnings.toFixed(4)} → ₦${userWallet.totalEarnings.toFixed(4)}`);
      
      // Step 3: Create ROI transaction record
      console.log('🔧 STEP 3: CREATING ROI TRANSACTION RECORD');
      
      const db = mongoose.connection.db;
      const transactionsCollection = db.collection('transactions');
      
      const transaction = {
        userId: investment.userId,
        type: 'roi',
        status: 'success',
        amount: missingRoi,
        currency: investment.currency,
        description: `24-Hour Cycle ROI payment for investment ${investment._id} (recovered missing amount)`,
        reference: `ROI-RECOVERED-${investment._id}-${Date.now()}`,
        investmentId: investment._id,
        planId: investment.planId,
        processedAt: now,
        isAutomated: true,
        createdAt: now,
        updatedAt: now
      };
      
      const result = await transactionsCollection.insertOne(transaction);
      
      if (result.acknowledged) {
        console.log(`   ✅ Created ROI transaction: ${missingRoi.toFixed(4)} ${investment.currency}`);
        console.log(`   ✅ Transaction ID: ${result.insertedId}`);
        totalRecovered++;
      } else {
        console.log('   ❌ Failed to create ROI transaction');
      }
      
      console.log('');
    }
    
    console.log('=' .repeat(80));
    console.log(`🎯 ROI RECOVERY COMPLETED!`);
    console.log(`   Total investments processed: ${targetInvestments.length}`);
    console.log(`   Total ROI recovered: ${totalRecovered}`);
    console.log('=' .repeat(80));
    
    // Verify the recovery
    console.log('\n🔍 VERIFYING RECOVERY:\n');
    
    for (const investment of targetInvestments) {
      const updatedInvestment = await Investment.findById(investment._id);
      
      console.log(`📊 Investment ID: ${investment._id}:`);
      console.log(`   Total Accumulated ROI: ₦${updatedInvestment.totalAccumulatedRoi.toFixed(4)}`);
      console.log(`   Expected Total ROI: ₦3,350.0000`);
      console.log(`   Status: ${updatedInvestment.totalAccumulatedRoi >= 3350 ? '✅ RECOVERED' : '❌ STILL MISSING'}`);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error recovering missing ROI:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await recoverMissingRoi();
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

module.exports = { recoverMissingRoi };
