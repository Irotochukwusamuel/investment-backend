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

// Notification Schema
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['success', 'warning', 'info', 'error'], required: true },
  category: { type: String, enum: ['investment', 'transaction', 'account', 'security', 'system', 'bonus', 'withdrawal', 'deposit', 'roi'], required: true },
  read: { type: Boolean, default: false },
  readAt: Date,
  readBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: Object,
  actionUrl: String,
  actionText: String,
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  relatedType: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Investment = mongoose.model('Investment', investmentSchema);
const User = mongoose.model('User', userSchema);
const InvestmentPlan = mongoose.model('InvestmentPlan', investmentPlanSchema);
const Notification = mongoose.model('Notification', notificationSchema);

async function sendRoiNotifications() {
  console.log('🔔 SENDING ROI NOTIFICATIONS\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Current Time: ${now.toISOString()}\n`);
    
    // Find all investments with ₦50,000 and 6.7% ROI that were recovered
    const targetInvestments = await Investment.find({
      amount: 50000,
      dailyRoi: 6.7,
      status: 'active'
    }).populate('userId', 'firstName lastName email').populate('planId', 'name');
    
    console.log(`📊 Found ${targetInvestments.length} investments to send notifications for\n`);
    
    let notificationsSent = 0;
    
    for (const investment of targetInvestments) {
      const user = investment.userId;
      const plan = investment.planId;
      
      if (!user || !plan) {
        console.log(`⚠️ Skipping investment ${investment._id} - missing user or plan data`);
        continue;
      }
      
      console.log('=' .repeat(60));
      console.log(`🔔 SENDING NOTIFICATION FOR: ${user.firstName} ${user.lastName}`);
      console.log('=' .repeat(60));
      
      // Since ROI was already recovered, we'll send notifications about the current state
      const currentTotal = investment.totalAccumulatedRoi || 0;
      const expectedDailyRoi = (investment.amount * investment.dailyRoi) / 100; // ₦3,350
      
      console.log(`📊 Current total ROI: ₦${currentTotal.toFixed(4)}`);
      console.log(`📊 Expected daily ROI: ₦${expectedDailyRoi.toFixed(4)}`);
      
      if (currentTotal < expectedDailyRoi) {
        console.log(`⚠️ ROI still missing for ${user.firstName} ${user.lastName}`);
        continue;
      }
      
      console.log('📊 NOTIFICATION DETAILS:');
      console.log(`   User: ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Plan: ${plan.name}`);
      console.log(`   Current Total ROI: ₦${currentTotal.toFixed(4)}`);
      console.log(`   Expected Daily ROI: ₦${expectedDailyRoi.toFixed(4)}`);
      console.log('');
      
             // Create ROI notification
       try {
         const notification = new Notification({
           userId: user._id,
           title: 'ROI Payment Received',
           message: `You've received ₦${expectedDailyRoi.toFixed(4)} ROI from your ${plan.name} investment. Your total earnings are now ₦${currentTotal.toFixed(4)}.`,
           type: 'success',
           category: 'roi',
           actionUrl: '/dashboard/investments',
           actionText: 'View Investment',
           relatedId: investment._id,
           relatedType: 'investment',
           metadata: {
             roiAmount: expectedDailyRoi,
             currency: investment.currency,
             planName: plan.name,
             totalEarnings: currentTotal,
             paymentType: '24-hour-cycle',
             paymentDate: now
           }
         });
        
        await notification.save();
        
        console.log(`   ✅ Created ROI notification for ${user.firstName} ${user.lastName}`);
        console.log(`   ✅ Notification ID: ${notification._id}`);
        notificationsSent++;
        
      } catch (notificationError) {
        console.error(`   ❌ Failed to create notification for ${user.firstName} ${user.lastName}:`, notificationError);
      }
      
      // Create additional success notification
      try {
        const successNotification = new Notification({
          userId: user._id,
          title: 'Investment ROI Updated',
          message: `Your ${plan.name} investment total earnings have been updated to ₦${investment.totalAccumulatedRoi.toFixed(4)}.`,
          type: 'success',
          category: 'investment',
          actionUrl: '/dashboard/investments',
          actionText: 'View Investment',
          relatedId: investment._id,
          relatedType: 'investment',
          metadata: {
            totalEarnings: investment.totalAccumulatedRoi,
            currency: investment.currency,
            planName: plan.name,
            updateType: 'roi-recovery'
          }
        });
        
        await successNotification.save();
        
        console.log(`   ✅ Created success notification for ${user.firstName} ${user.lastName}`);
        
      } catch (successNotificationError) {
        console.error(`   ❌ Failed to create success notification for ${user.firstName} ${user.lastName}:`, successNotificationError);
      }
      
      console.log('');
    }
    
    console.log('=' .repeat(80));
    console.log(`🎯 ROI NOTIFICATIONS COMPLETED!`);
    console.log(`   Total investments processed: ${targetInvestments.length}`);
    console.log(`   Total notifications sent: ${notificationsSent}`);
    console.log('=' .repeat(80));
    
    // Verify notifications were created
    console.log('\n🔍 VERIFYING NOTIFICATIONS:\n');
    
    for (const investment of targetInvestments) {
      const user = investment.userId;
      if (!user) continue;
      
      const userNotifications = await Notification.find({
        userId: user._id,
        category: 'roi'
      }).sort({ createdAt: -1 }).limit(3);
      
      console.log(`📊 ${user.firstName} ${user.lastName}:`);
      console.log(`   Total ROI notifications: ${userNotifications.length}`);
      
      for (const notif of userNotifications) {
        const timeAgo = Math.floor((now.getTime() - new Date(notif.createdAt).getTime()) / (1000 * 60));
        console.log(`      - ${notif.title} (${timeAgo} minutes ago)`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error sending ROI notifications:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await sendRoiNotifications();
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

module.exports = { sendRoiNotifications };
