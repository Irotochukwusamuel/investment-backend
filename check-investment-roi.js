const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kltmines';

async function checkInvestmentRoi() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Investment = mongoose.model('Investment', new mongoose.Schema({}, { strict: false }));
    
    // Find user by email
    const user = await User.findOne({ email: 'clairclancy@gmail.com' }).lean();
    if (!user) {
      console.log('❌ User with email clairclancy@gmail.com not found');
      return;
    }
    
    console.log('👤 Found user:', user.firstName, user.lastName, user.email);
    console.log('👤 User ID:', user._id);
    
    // Get user's investments
    const investments = await Investment.find({ userId: user._id }).lean();
    console.log('📊 User investments:', investments.length);
    
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
      
      // Get ROI transactions for this investment
      const roiTransactions = await Transaction.find({ 
        investmentId: investment._id,
        type: 'roi'
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
      
      console.log('   ROI transactions for this investment:', roiTransactions.length);
      if (roiTransactions.length > 0) {
        console.log('   Recent transactions:');
        roiTransactions.forEach((tx, index) => {
          console.log(`     ${index + 1}. ${tx.amount} ${tx.currency} - ${tx.description} - ${tx.createdAt}`);
        });
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkInvestmentRoi();

