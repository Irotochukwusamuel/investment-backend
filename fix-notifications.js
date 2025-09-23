const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kltmines';

async function fixNotifications() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false }));
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Investment = mongoose.model('Investment', new mongoose.Schema({}, { strict: false }));
    const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
    
    // Find user by email
    const user = await User.findOne({ email: 'clairclancy@gmail.com' }).lean();
    if (!user) {
      console.log('❌ User with email clairclancy@gmail.com not found');
      return;
    }
    
    console.log('👤 Found user:', user.firstName, user.lastName, user.email);
    
    // Get user's investments
    const investments = await Investment.find({ userId: user._id }).lean();
    console.log('📊 User investments:', investments.length);
    
    for (const investment of investments) {
      console.log('\n💰 Fixing investment:', investment._id);
      
      // Calculate total ROI from existing transactions
      const roiTransactions = await Transaction.find({ 
        investmentId: investment._id,
        type: 'roi',
        status: 'success'
      }).lean();
      
      const totalFromTransactions = roiTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      console.log('   Total ROI from transactions:', totalFromTransactions);
      
      // Set nextRoiCycleDate to 24 hours from now
      const now = new Date();
      const nextRoiCycleDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      // Update the investment
      const updateData = {
        totalAccumulatedRoi: totalFromTransactions,
        nextRoiCycleDate: nextRoiCycleDate,
        earnedAmount: investment.earnedAmount || 0
      };
      
      console.log('   Updating investment with:');
      console.log('     totalAccumulatedRoi:', updateData.totalAccumulatedRoi);
      console.log('     nextRoiCycleDate:', updateData.nextRoiCycleDate);
      
      await Investment.findByIdAndUpdate(investment._id, { $set: updateData });
      console.log('   ✅ Investment updated successfully');
      
      // Create some test ROI notifications based on recent transactions
      if (roiTransactions.length > 0) {
        console.log('   📧 Creating test ROI notifications...');
        
        // Create notifications for the last 5 ROI transactions
        const recentTransactions = roiTransactions.slice(0, 5);
        
        for (const tx of recentTransactions) {
          const notification = new Notification({
            userId: user._id,
            title: 'ROI Payment Received',
            message: `You've received ₦${tx.amount.toFixed(4)} ROI from your investment. Your total earnings are now ₦${totalFromTransactions.toFixed(4)}.`,
            type: 'success',
            category: 'roi',
            actionUrl: '/dashboard/investments',
            actionText: 'View Investment',
            relatedId: investment._id,
            relatedType: 'investment',
            read: false,
            metadata: {
              roiAmount: tx.amount,
              currency: tx.currency,
              totalEarnings: totalFromTransactions,
              paymentType: '24-hour-cycle',
              paymentDate: tx.createdAt
            },
            createdAt: tx.createdAt,
            updatedAt: new Date()
          });
          
          await notification.save();
          console.log(`     ✅ Created notification for ₦${tx.amount} ROI payment`);
        }
      }
    }
    
    // Verify notifications were created
    const userNotifications = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();
    
    console.log('\n📊 Total notifications for user after fix:', userNotifications.length);
    
    await mongoose.disconnect();
    console.log('\n🎉 Investment and notifications fixed!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixNotifications();

