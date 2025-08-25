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

async function manualRoiTransferTest() {
  console.log('🧪 MANUAL ROI TRANSFER TEST\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Current Time: ${now.toISOString()}\n`);
    
    // Get the first active investment for testing
    const testInvestment = await Investment.findOne({
      status: 'active',
      endDate: { $gt: now }
    });
    
    if (!testInvestment) {
      console.log('❌ No active investments found for testing');
      return;
    }
    
    console.log(`💰 TESTING WITH INVESTMENT: ${testInvestment._id}\n`);
    console.log('📊 Investment Details:');
    console.log(`   Amount: ${testInvestment.amount} ${testInvestment.currency}`);
    console.log(`   Daily ROI: ${testInvestment.dailyRoi}%`);
    console.log(`   Current earnedAmount: ${testInvestment.earnedAmount || 0}`);
    console.log(`   Current totalAccumulatedRoi: ${testInvestment.totalAccumulatedRoi || 0}`);
    console.log(`   User ID: ${testInvestment.userId}`);
    console.log('');
    
    // Check user's wallet
    console.log('🔍 CHECKING USER WALLET:\n');
    
    const userWallet = await Wallet.findOne({
      userId: testInvestment.userId,
      type: 'main'
    });
    
    if (!userWallet) {
      console.log('❌ User wallet not found');
      console.log('   This could be why ROI transfers are failing!');
      return;
    }
    
    console.log('✅ User wallet found:');
    console.log(`   Naira Balance: ${userWallet.nairaBalance}`);
    console.log(`   USDT Balance: ${userWallet.usdtBalance}`);
    console.log(`   Total Earnings: ${userWallet.totalEarnings}`);
    console.log(`   Total Deposits: ${userWallet.totalDeposits}`);
    console.log('');
    
    // Simulate the ROI transfer logic
    console.log('🧪 SIMULATING ROI TRANSFER LOGIC:\n');
    
    const currentEarnedAmount = testInvestment.earnedAmount || 0;
    
    if (currentEarnedAmount > 0) {
      console.log(`💰 Would transfer ${currentEarnedAmount} ${testInvestment.currency} to wallet`);
      
      // Calculate new wallet balance
      let newNairaBalance = userWallet.nairaBalance;
      let newUsdtBalance = userWallet.usdtBalance;
      let newTotalEarnings = userWallet.totalEarnings;
      
      if (testInvestment.currency === 'naira') {
        newNairaBalance += currentEarnedAmount;
        newTotalEarnings += currentEarnedAmount;
      } else {
        newUsdtBalance += currentEarnedAmount;
        newTotalEarnings += currentEarnedAmount;
      }
      
      console.log('   New wallet balances would be:');
      console.log(`     Naira: ${newNairaBalance} (was ${userWallet.nairaBalance})`);
      console.log(`     USDT: ${newUsdtBalance} (was ${userWallet.usdtBalance})`);
      console.log(`     Total Earnings: ${newTotalEarnings} (was ${userWallet.totalEarnings})`);
      
    } else {
      console.log('❌ No earned amount to transfer (earnedAmount = 0)');
      console.log('   This investment has already been processed or reset');
    }
    
    console.log('');
    
    // Check if there are any recent ROI transactions for this investment
    console.log('🔍 CHECKING RECENT ROI TRANSACTIONS:\n');
    
    const db = mongoose.connection.db;
    const transactionsCollection = db.collection('transactions');
    
    const recentRoiTransactions = await transactionsCollection.find({
      investmentId: testInvestment._id,
      type: 'roi',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    }).sort({ createdAt: -1 }).limit(5).toArray();
    
    if (recentRoiTransactions.length === 0) {
      console.log('❌ NO ROI TRANSACTIONS FOUND for this investment in last 7 days');
      console.log('   This confirms the ROI transfer is completely failing!');
    } else {
      console.log(`📊 Found ${recentRoiTransactions.length} ROI transactions in last 7 days:`);
      
      for (const tx of recentRoiTransactions) {
        const txDate = new Date(tx.createdAt);
        const timeAgo = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   ${tx.amount} ${tx.currency} - ${timeAgo} days ago - ${tx.status} - ${tx.description || 'No description'}`);
      }
    }
    
    console.log('');
    console.log('=' .repeat(80));
    
  } catch (error) {
    console.error('❌ Error in manual ROI transfer test:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await manualRoiTransferTest();
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

module.exports = { manualRoiTransferTest };
