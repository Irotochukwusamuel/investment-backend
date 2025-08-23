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

const Investment = mongoose.model('Investment', investmentSchema);

async function fixNextRoiUpdateTimestamps() {
  console.log('🔧 FIXING NEXT ROI UPDATE TIMESTAMPS\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Fix Time: ${now.toISOString()}\n`);
    
    // Get all active investments
    const activeInvestments = await Investment.find({
      status: 'active',
      endDate: { $gt: now }
    }).sort({ startDate: 1 });
    
    console.log(`📊 Found ${activeInvestments.length} active investments to fix\n`);
    
    let totalFixed = 0;
    
    for (const investment of activeInvestments) {
      console.log('=' .repeat(60));
      console.log(`💰 INVESTMENT: ${investment._id}`);
      console.log('=' .repeat(60));
      
      const lastRoiUpdate = investment.lastRoiUpdate ? new Date(investment.lastRoiUpdate) : new Date(investment.startDate);
      const currentNextRoiUpdate = investment.nextRoiUpdate ? new Date(investment.nextRoiUpdate) : null;
      
      // Calculate what nextRoiUpdate SHOULD be (1 hour from lastRoiUpdate)
      const correctNextRoiUpdate = new Date(lastRoiUpdate.getTime() + 60 * 60 * 1000);
      
      console.log('📊 CURRENT STATE:');
      console.log(`   lastRoiUpdate: ${lastRoiUpdate.toISOString()}`);
      console.log(`   current nextRoiUpdate: ${currentNextRoiUpdate ? currentNextRoiUpdate.toISOString() : 'Not set'}`);
      console.log(`   correct nextRoiUpdate: ${correctNextRoiUpdate.toISOString()}`);
      console.log('');
      
      // Check if the current nextRoiUpdate is wrong
      let needsFix = false;
      let reason = '';
      
      if (!currentNextRoiUpdate) {
        needsFix = true;
        reason = 'nextRoiUpdate not set';
      } else {
        const timeDifference = Math.abs(currentNextRoiUpdate.getTime() - correctNextRoiUpdate.getTime());
        const minutesDifference = Math.floor(timeDifference / (1000 * 60));
        
        if (minutesDifference > 1) { // Allow 1 minute tolerance
          needsFix = true;
          reason = `nextRoiUpdate is ${minutesDifference} minutes off`;
        }
      }
      
      if (needsFix) {
        console.log('🔧 APPLYING FIX:');
        console.log(`   Reason: ${reason}`);
        console.log(`   Current: ${currentNextRoiUpdate ? currentNextRoiUpdate.toISOString() : 'Not set'}`);
        console.log(`   Fixed to: ${correctNextRoiUpdate.toISOString()}`);
        
        // Update the investment
        await Investment.updateOne(
          { _id: investment._id },
          { $set: { nextRoiUpdate: correctNextRoiUpdate } }
        );
        
        totalFixed++;
        console.log(`   ✅ Investment ${investment._id} timestamp fixed`);
      } else {
        console.log('✅ No fix needed - timestamp is correct');
      }
      
      console.log('');
    }
    
    console.log('=' .repeat(80));
    console.log(`🎯 TIMESTAMP FIX COMPLETED!`);
    console.log(`   Total investments fixed: ${totalFixed}`);
    console.log(`   Total investments processed: ${activeInvestments.length}`);
    console.log('=' .repeat(80));
    
  } catch (error) {
    console.error('❌ Error fixing timestamps:', error);
  }
}

async function verifyFix() {
  console.log('\n🧪 VERIFYING THE FIX...\n');
  
  try {
    const activeInvestments = await Investment.find({
      status: 'active'
    });
    
    let correctCount = 0;
    let totalCount = 0;
    
    for (const investment of activeInvestments) {
      totalCount++;
      console.log(`💰 Investment: ${investment._id}`);
      
      const lastRoiUpdate = investment.lastRoiUpdate ? new Date(investment.lastRoiUpdate) : new Date(investment.startDate);
      const nextRoiUpdate = investment.nextRoiUpdate ? new Date(investment.nextRoiUpdate) : null;
      
      if (nextRoiUpdate) {
        const expectedNextRoiUpdate = new Date(lastRoiUpdate.getTime() + 60 * 60 * 1000);
        const timeDifference = Math.abs(nextRoiUpdate.getTime() - expectedNextRoiUpdate.getTime());
        const minutesDifference = Math.floor(timeDifference / (1000 * 60));
        
        if (minutesDifference <= 1) {
          correctCount++;
          console.log(`   ✅ CORRECT - nextRoiUpdate: ${nextRoiUpdate.toISOString()}`);
        } else {
          console.log(`   ❌ INCORRECT - nextRoiUpdate: ${nextRoiUpdate.toISOString()} (should be ${expectedNextRoiUpdate.toISOString()}, ${minutesDifference} minutes off)`);
        }
      } else {
        console.log(`   ❌ MISSING - nextRoiUpdate not set`);
      }
      console.log('');
    }
    
    console.log(`🎯 VERIFICATION COMPLETED: ${correctCount}/${totalCount} investments have correct nextRoiUpdate timestamps`);
    
  } catch (error) {
    console.error('❌ Error verifying fix:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await fixNextRoiUpdateTimestamps();
    await verifyFix();
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

module.exports = { fixNextRoiUpdateTimestamps, verifyFix };
