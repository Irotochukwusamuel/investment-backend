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

// Transaction Schema - using the exact schema from the backend
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
  reference: String,
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'InvestmentPlan' },
  isAutomated: Boolean
});

const Transaction = mongoose.model('transactions', transactionSchema);

async function checkTransactionRecords() {
  console.log('🔍 CHECKING TRANSACTION RECORDS\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Current Time: ${now.toISOString()}\n`);
    
    // Check all transactions from the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    console.log('📋 ALL TRANSACTIONS FROM LAST 24 HOURS:\n');
    
    const allTransactions = await Transaction.find({
      createdAt: { $gte: oneDayAgo }
    }).sort({ createdAt: -1 });
    
    if (allTransactions.length === 0) {
      console.log('❌ NO TRANSACTIONS FOUND IN LAST 24 HOURS');
    } else {
      console.log(`📊 Found ${allTransactions.length} transactions in last 24 hours:\n`);
      
      for (const tx of allTransactions) {
        const txDate = new Date(tx.createdAt);
        const timeAgo = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60));
        const minutesAgo = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60));
        
        console.log(`💰 Transaction: ${tx._id}`);
        console.log(`   Type: ${tx.type}`);
        console.log(`   Amount: ${tx.amount} ${tx.currency}`);
        console.log(`   Status: ${tx.status}`);
        console.log(`   Description: ${tx.description || 'No description'}`);
        console.log(`   Reference: ${tx.reference || 'No reference'}`);
        console.log(`   Created: ${txDate.toISOString()} (${timeAgo}h ${minutesAgo % 60}m ago)`);
        console.log(`   Investment ID: ${tx.investmentId || 'N/A'}`);
        console.log(`   User ID: ${tx.userId || 'N/A'}`);
        console.log(`   Is Automated: ${tx.isAutomated || false}`);
        console.log('');
      }
    }
    
    // Check specifically for ROI transactions
    console.log('🎯 SPECIFICALLY CHECKING FOR ROI TRANSACTIONS:\n');
    
    const roiTransactions = await Transaction.find({
      type: 'roi',
      createdAt: { $gte: oneDayAgo }
    }).sort({ createdAt: -1 });
    
    if (roiTransactions.length === 0) {
      console.log('❌ NO ROI TRANSACTIONS FOUND IN LAST 24 HOURS');
    } else {
      console.log(`📊 Found ${roiTransactions.length} ROI transactions in last 24 hours:\n`);
      
      for (const tx of roiTransactions) {
        const txDate = new Date(tx.createdAt);
        const timeAgo = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60));
        const minutesAgo = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60));
        
        console.log(`💰 ROI Transaction: ${tx._id}`);
        console.log(`   Amount: ${tx.amount} ${tx.currency}`);
        console.log(`   Status: ${tx.status}`);
        console.log(`   Description: ${tx.description || 'No description'}`);
        console.log(`   Reference: ${tx.reference || 'No reference'}`);
        console.log(`   Created: ${txDate.toISOString()} (${timeAgo}h ${minutesAgo % 60}m ago)`);
        console.log(`   Investment ID: ${tx.investmentId || 'N/A'}`);
        console.log(`   User ID: ${tx.userId || 'N/A'}`);
        console.log(`   Is Automated: ${tx.isAutomated || false}`);
        console.log('');
      }
    }
    
    // Check for any transactions with "recovered" in description
    console.log('🔍 CHECKING FOR RECOVERED TRANSACTIONS:\n');
    
    const recoveredTransactions = await Transaction.find({
      description: { $regex: /recovered/i },
      createdAt: { $gte: oneDayAgo }
    }).sort({ createdAt: -1 });
    
    if (recoveredTransactions.length === 0) {
      console.log('❌ NO RECOVERED TRANSACTIONS FOUND IN LAST 24 HOURS');
    } else {
      console.log(`📊 Found ${recoveredTransactions.length} recovered transactions in last 24 hours:\n`);
      
      for (const tx of recoveredTransactions) {
        const txDate = new Date(tx.createdAt);
        const timeAgo = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60));
        const minutesAgo = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60));
        
        console.log(`💰 Recovered Transaction: ${tx._id}`);
        console.log(`   Type: ${tx.type}`);
        console.log(`   Amount: ${tx.amount} ${tx.currency}`);
        console.log(`   Status: ${tx.status}`);
        console.log(`   Description: ${tx.description || 'No description'}`);
        console.log(`   Reference: ${tx.reference || 'No reference'}`);
        console.log(`   Created: ${txDate.toISOString()} (${timeAgo}h ${minutesAgo % 60}m ago)`);
        console.log('');
      }
    }
    
    console.log('=' .repeat(80));
    
  } catch (error) {
    console.error('❌ Error checking transaction records:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await checkTransactionRecords();
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

module.exports = { checkTransactionRecords };
