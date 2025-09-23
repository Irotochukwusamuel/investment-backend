const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kltmines';

async function checkNotifications() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false }));
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    // Find user by email
    const user = await User.findOne({ email: 'clairclancy@gmail.com' }).lean();
    if (!user) {
      console.log('❌ User with email clairclancy@gmail.com not found');
      return;
    }
    
    console.log('👤 Found user:', user.firstName, user.lastName, user.email);
    console.log('👤 User ID:', user._id);
    
    // Check notifications for this user
    const notifications = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    console.log('📊 Total notifications for this user:', notifications.length);
    
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
    
    // Check all notifications in the system
    const totalNotifications = await Notification.countDocuments();
    console.log('📊 Total notifications in system:', totalNotifications);
    
    // Check ROI notifications specifically
    const roiNotifications = await Notification.find({ category: 'roi' })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    console.log('📊 ROI notifications in system:', roiNotifications.length);
    if (roiNotifications.length > 0) {
      console.log('📊 Recent ROI notifications:');
      roiNotifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.title} - ${notif.createdAt}`);
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkNotifications();

