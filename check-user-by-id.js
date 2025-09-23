const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kltmines';

async function checkUserById() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false }));
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Investment = mongoose.model('Investment', new mongoose.Schema({}, { strict: false }));
    const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
    
    const userId = '688e2ac7b9de4395e902d40e';
    
    // Find user by ID
    const user = await User.findById(userId).lean();
    if (!user) {
      console.log('❌ User with ID', userId, 'not found');
      return;
    }
    
    console.log('👤 Found user:', user.firstName, user.lastName, user.email);
    console.log('👤 User ID:', user._id);
    
    // Check notifications for this user
    const notifications = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    console.log('\n📊 Notifications for this user:', notifications.length);
    
    if (notifications.length > 0) {
      console.log('📊 Recent notifications:');
      notifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.title}`);
        console.log(`      Message: ${notif.message}`);
        console.log(`      Type: ${notif.type}`);
        console.log(`      Category: ${notif.category}`);
        console.log(`      Read: ${notif.read}`);
        console.log(`      Created: ${notif.createdAt}`);
        console.log('');
      });
      
      // Check unread count
      const unreadCount = await Notification.countDocuments({ 
        userId: user._id,
        read: { $ne: true }
      });
      console.log('📊 Unread notifications:', unreadCount);
      
    } else {
      console.log('❌ No notifications found for this user');
    }
    
    // Check ROI transactions for this user
    const roiTransactions = await Transaction.find({ 
      userId: user._id,
      type: 'roi'
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
    
    console.log('\n📊 ROI transactions for this user:', roiTransactions.length);
    
    if (roiTransactions.length > 0) {
      console.log('📊 Recent ROI transactions:');
      roiTransactions.forEach((tx, index) => {
        console.log(`   ${index + 1}. ${tx.amount} ${tx.currency} - ${tx.status} - ${tx.createdAt}`);
        console.log(`      Description: ${tx.description}`);
        console.log(`      Investment ID: ${tx.investmentId}`);
      });
      
      // Get total count
      const totalRoiTransactions = await Transaction.countDocuments({ 
        userId: user._id,
        type: 'roi'
      });
      console.log('📊 Total ROI transactions for this user:', totalRoiTransactions);
      
      // Get status breakdown
      const statusCounts = await Transaction.aggregate([
        { $match: { userId: user._id, type: 'roi' } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      
      console.log('📊 ROI transaction status breakdown:');
      statusCounts.forEach(status => {
        console.log(`   ${status._id}: ${status.count}`);
      });
      
    } else {
      console.log('❌ No ROI transactions found for this user');
    }
    
    // Check user's investments
    const investments = await Investment.find({ userId: user._id }).lean();
    console.log('\n📊 User investments:', investments.length);
    
    for (const investment of investments) {
      console.log('\n💰 Investment:', investment._id);
      console.log('   Amount:', investment.amount, investment.currency);
      console.log('   Daily ROI:', investment.dailyRoi + '%');
      console.log('   Status:', investment.status);
      console.log('   Start Date:', investment.startDate);
      console.log('   End Date:', investment.endDate);
      console.log('   Earned Amount:', investment.earnedAmount);
      console.log('   Total Accumulated ROI:', investment.totalAccumulatedRoi);
      console.log('   Last ROI Update:', investment.lastRoiUpdate);
      console.log('   Next ROI Cycle Date:', investment.nextRoiCycleDate);
      console.log('   Next ROI Update:', investment.nextRoiUpdate);
      
      // Check if 24-hour cycle is due
      const now = new Date();
      const needs24HourCycle = investment.nextRoiCycleDate && new Date(investment.nextRoiCycleDate) <= now;
      const needsHourlyUpdate = investment.nextRoiUpdate && new Date(investment.nextRoiUpdate) <= now;
      
      console.log('   Needs 24-hour cycle:', needs24HourCycle);
      console.log('   Needs hourly update:', needsHourlyUpdate);
      
      if (needs24HourCycle) {
        console.log('   ⚠️ 24-hour cycle is OVERDUE!');
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUserById();

