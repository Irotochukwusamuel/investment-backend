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

// Notification Schema
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  message: String,
  type: String,
  category: String,
  read: Boolean,
  readAt: Date,
  metadata: Object,
  actionUrl: String,
  actionText: String,
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  relatedType: String,
  createdAt: Date,
  updatedAt: Date
});

// User Schema
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String
});

const Investment = mongoose.model('Investment', investmentSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const User = mongoose.model('User', userSchema);

async function testProfessionalRequirements() {
  console.log('🧪 TESTING PROFESSIONAL REQUIREMENTS\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Current Time: ${now.toISOString()}\n`);
    
    // Test 1: Only One Active Investment at a Time
    console.log('🎯 REQUIREMENT 1: ONLY ONE ACTIVE INVESTMENT AT A TIME\n');
    console.log('=' .repeat(60));
    
    const allUsers = await User.find().limit(5);
    
    for (const user of allUsers) {
      const activeInvestments = await Investment.find({
        userId: user._id,
        status: 'active'
      });
      
      console.log(`👤 ${user.firstName} ${user.lastName}:`);
      console.log(`   Active Investments: ${activeInvestments.length}`);
      
      if (activeInvestments.length === 0) {
        console.log(`   Status: ✅ COMPLIANT - No active investments`);
      } else if (activeInvestments.length === 1) {
        console.log(`   Status: ✅ COMPLIANT - Exactly 1 active investment`);
        console.log(`   Investment ID: ${activeInvestments[0]._id}`);
        console.log(`   Amount: ₦${activeInvestments[0].amount.toLocaleString()}`);
        console.log(`   Plan: ${activeInvestments[0].planId || 'N/A'}`);
      } else {
        console.log(`   Status: ❌ VIOLATION - ${activeInvestments.length} active investments (should be 1 or 0)`);
        for (const inv of activeInvestments) {
          console.log(`      - ${inv._id}: ₦${inv.amount.toLocaleString()}`);
        }
      }
      console.log('');
    }
    
    // Test 2: Automatic ROI Withdrawal into Available Balance
    console.log('🎯 REQUIREMENT 2: AUTOMATIC ROI WITHDRAWAL AFTER 24HR CYCLE\n');
    console.log('=' .repeat(60));
    
    const activeInvestments = await Investment.find({
      status: 'active'
    }).populate('userId', 'firstName lastName');
    
    console.log(`📊 Found ${activeInvestments.length} active investments to test\n`);
    
    for (const investment of activeInvestments) {
      const user = investment.userId;
      console.log(`🔍 Testing Investment: ${investment._id}`);
      console.log(`   User: ${user.firstName} ${user.lastName}`);
      console.log(`   Amount: ₦${investment.amount.toLocaleString()}`);
      console.log(`   Daily ROI: ${investment.dailyRoi}%`);
      console.log(`   Expected Daily ROI: ₦${(investment.amount * investment.dailyRoi / 100).toFixed(4)}`);
      console.log(`   Total Accumulated ROI: ₦${investment.totalAccumulatedRoi.toFixed(4)}`);
      console.log(`   Earned Amount (Current Cycle): ₦${investment.earnedAmount.toFixed(4)}`);
      
      // Check for ROI transactions
      const roiTransactions = await Transaction.find({
        investmentId: investment._id,
        type: 'roi',
        status: 'success'
      }).sort({ createdAt: -1 });
      
      console.log(`   ROI Transactions: ${roiTransactions.length}`);
      
      if (roiTransactions.length > 0) {
        const totalFromTransactions = roiTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        console.log(`   Total from Transactions: ₦${totalFromTransactions.toFixed(4)}`);
        
        if (Math.abs(totalFromTransactions - investment.totalAccumulatedRoi) <= 0.01) {
          console.log(`   Status: ✅ COMPLIANT - ROI properly withdrawn and recorded`);
        } else {
          console.log(`   Status: ⚠️ INCONSISTENT - Transaction total doesn't match investment total`);
        }
      } else {
        console.log(`   Status: ⚠️ NO TRANSACTIONS - Check if 24-hour cycle has completed`);
      }
      
      // Check timing
      if (investment.nextRoiCycleDate) {
        const timeUntilNextCycle = investment.nextRoiCycleDate.getTime() - now.getTime();
        const hoursUntilNext = Math.floor(timeUntilNextCycle / (1000 * 60 * 60));
        console.log(`   Next ROI Cycle: ${hoursUntilNext} hours from now`);
      }
      
      console.log('');
    }
    
    // Test 3: ROI Notification History
    console.log('🎯 REQUIREMENT 3: ROI NOTIFICATION HISTORY\n');
    console.log('=' .repeat(60));
    
    const usersWithRoiNotifications = await Notification.aggregate([
      { $match: { category: 'roi' } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    console.log(`📊 Top 5 users with ROI notifications:\n`);
    
    for (const userStats of usersWithRoiNotifications) {
      const user = await User.findById(userStats._id);
      if (!user) continue;
      
      const roiNotifications = await Notification.find({
        userId: user._id,
        category: 'roi'
      }).sort({ createdAt: -1 });
      
      console.log(`👤 ${user.firstName} ${user.lastName}:`);
      console.log(`   Total ROI Notifications: ${userStats.count}`);
      
      if (roiNotifications.length > 0) {
        const lastNotification = roiNotifications[0];
        const timeAgo = Math.floor((now.getTime() - new Date(lastNotification.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        
        console.log(`   Last Notification: ${timeAgo} days ago`);
        console.log(`   Title: ${lastNotification.title}`);
        console.log(`   Type: ${lastNotification.metadata?.cycleType || 'unknown'}`);
        
        // Check notification metadata
        if (lastNotification.metadata) {
          console.log(`   ROI Amount: ₦${lastNotification.metadata.roiAmount?.toFixed(4) || 'N/A'}`);
          console.log(`   Plan Name: ${lastNotification.metadata.planName || 'N/A'}`);
        }
      }
      
      console.log('');
    }
    
    // Overall system compliance check
    console.log('=' .repeat(80));
    console.log('🎯 OVERALL COMPLIANCE ASSESSMENT\n');
    console.log('=' .repeat(80));
    
    const totalActiveInvestments = await Investment.countDocuments({ status: 'active' });
    const totalUsers = await User.countDocuments();
    const totalRoiNotifications = await Notification.countDocuments({ category: 'roi' });
    const totalRoiTransactions = await Transaction.countDocuments({ type: 'roi', status: 'success' });
    
    console.log('📊 SYSTEM STATISTICS:');
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Total Active Investments: ${totalActiveInvestments}`);
    console.log(`   Total ROI Notifications: ${totalRoiNotifications}`);
    console.log(`   Total ROI Transactions: ${totalRoiTransactions}`);
    console.log('');
    
    // Compliance scoring
    let complianceScore = 0;
    let totalChecks = 3;
    
    // Check 1: One active investment per user
    const usersWithMultipleInvestments = await Investment.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    if (usersWithMultipleInvestments.length === 0) {
      console.log('✅ REQUIREMENT 1: COMPLIANT - All users have 0 or 1 active investment');
      complianceScore++;
    } else {
      console.log('❌ REQUIREMENT 1: VIOLATION - Some users have multiple active investments');
    }
    
    // Check 2: ROI transactions exist
    if (totalRoiTransactions > 0) {
      console.log('✅ REQUIREMENT 2: COMPLIANT - ROI transactions are being created');
      complianceScore++;
    } else {
      console.log('❌ REQUIREMENT 2: VIOLATION - No ROI transactions found');
    }
    
    // Check 3: ROI notifications exist
    if (totalRoiNotifications > 0) {
      console.log('✅ REQUIREMENT 3: COMPLIANT - ROI notifications are being sent');
      complianceScore++;
    } else {
      console.log('❌ REQUIREMENT 3: VIOLATION - No ROI notifications found');
    }
    
    console.log('');
    console.log(`🎯 COMPLIANCE SCORE: ${complianceScore}/${totalChecks} (${Math.round(complianceScore/totalChecks*100)}%)`);
    
    if (complianceScore === totalChecks) {
      console.log('🎉 ALL PROFESSIONAL REQUIREMENTS ARE MET!');
    } else {
      console.log('⚠️ Some requirements need attention');
    }
    
    console.log('=' .repeat(80));
    
  } catch (error) {
    console.error('❌ Error testing professional requirements:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await testProfessionalRequirements();
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

module.exports = { testProfessionalRequirements };
