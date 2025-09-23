const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kltmines';

async function debugNotifications() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false }));
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    // First, let's see what users exist
    console.log('\n🔍 Checking all users in database...');
    const allUsers = await User.find({}).limit(10).lean();
    console.log(`📊 Total users found: ${allUsers.length}`);
    
    if (allUsers.length > 0) {
      console.log('👥 Sample users:');
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user._id}`);
        console.log(`      Name: ${user.firstName} ${user.lastName}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      Created: ${user.createdAt}`);
        console.log('');
      });
    }
    
    // Check if the specific user exists with different ID formats
    console.log('🔍 Looking for specific user ID: 688e2ac7b9de4395e902d40e');
    const specificUser = await User.findOne({ 
      $or: [
        { _id: '688e2ac7b9de4395e902d40e' },
        { _id: new mongoose.Types.ObjectId('688e2ac7b9de4395e902d40e') }
      ]
    }).lean();
    
    if (specificUser) {
      console.log('✅ Found specific user:');
      console.log(`   ID: ${specificUser._id}`);
      console.log(`   Name: ${specificUser.firstName} ${specificUser.lastName}`);
      console.log(`   Email: ${specificUser.email}`);
      console.log(`   Created: ${specificUser.createdAt}`);
      
      // Check notifications for this user
      console.log('\n📊 Checking notifications for this user...');
      const userNotifications = await Notification.find({ userId: specificUser._id })
        .sort({ createdAt: -1 })
        .lean();
      
      console.log(`📊 Total notifications for user: ${userNotifications.length}`);
      
      if (userNotifications.length > 0) {
        console.log('📊 Recent notifications:');
        userNotifications.slice(0, 5).forEach((notif, index) => {
          console.log(`   ${index + 1}. ${notif.title}`);
          console.log(`      Message: ${notif.message}`);
          console.log(`      Type: ${notif.type}`);
          console.log(`      Category: ${notif.category}`);
          console.log(`      Read: ${notif.read}`);
          console.log(`      Created: ${notif.createdAt}`);
          console.log(`      User ID: ${notif.userId}`);
          console.log('');
        });
        
        // Check unread count
        const unreadCount = await Notification.countDocuments({ 
          userId: specificUser._id,
          read: { $ne: true }
        });
        console.log(`📊 Unread notifications: ${unreadCount}`);
      } else {
        console.log('❌ No notifications found for this user');
      }
    } else {
      console.log('❌ Specific user not found');
      
      // Let's try to find users with similar IDs
      console.log('\n🔍 Searching for users with similar IDs...');
      const similarUsers = await User.find({
        _id: { $regex: '688e2ac7b9de4395e902d40e' }
      }).lean();
      
      if (similarUsers.length > 0) {
        console.log('👥 Found users with similar IDs:');
        similarUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ID: ${user._id}`);
          console.log(`      Name: ${user.firstName} ${user.lastName}`);
          console.log(`      Email: ${user.email}`);
        });
      }
    }
    
    // Check total notifications in database
    console.log('\n📊 Database notification statistics:');
    const totalNotifications = await Notification.countDocuments();
    console.log(`📊 Total notifications in database: ${totalNotifications}`);
    
    if (totalNotifications > 0) {
      // Get notification breakdown by user
      const notificationStats = await Notification.aggregate([
        {
          $group: {
            _id: '$userId',
            count: { $sum: 1 },
            unreadCount: {
              $sum: { $cond: [{ $ne: ['$read', true] }, 1, 0] }
            }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      
      console.log('📊 Top 10 users by notification count:');
      for (const stat of notificationStats) {
        const user = await User.findById(stat._id).lean();
        console.log(`   User: ${user ? `${user.firstName} ${user.lastName}` : 'Unknown'} (${stat._id})`);
        console.log(`   Total: ${stat.count}, Unread: ${stat.unreadCount}`);
      }
      
      // Check notification types and categories
      const typeStats = await Notification.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      console.log('\n📊 Notification types:');
      typeStats.forEach(stat => {
        console.log(`   ${stat._id}: ${stat.count}`);
      });
      
      const categoryStats = await Notification.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      console.log('\n📊 Notification categories:');
      categoryStats.forEach(stat => {
        console.log(`   ${stat._id}: ${stat.count}`);
      });
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugNotifications();

