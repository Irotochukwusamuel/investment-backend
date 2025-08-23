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

async function fixCountdowns() {
  console.log('🔄 Starting countdown fixes...\n');
  
  try {
    // Get all active investments
    const investments = await Investment.find({
      status: 'active',
      endDate: { $gt: new Date() }
    });
    
    console.log(`📊 Found ${investments.length} active investments to fix countdowns\n`);
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const investment of investments) {
      try {
        console.log(`💰 Processing investment ${investment._id}`);
        
        const now = new Date();
        const startDate = new Date(investment.startDate);
        const nextRoiUpdate = investment.nextRoiUpdate ? new Date(investment.nextRoiUpdate) : null;
        
        console.log(`   Start date: ${startDate.toISOString()}`);
        console.log(`   Current nextRoiUpdate: ${nextRoiUpdate ? nextRoiUpdate.toISOString() : 'Not set'}`);
        console.log(`   Current time: ${now.toISOString()}`);
        
        let needsUpdate = false;
        const updates = {};
        
        // Check if nextRoiUpdate is missing or in the past
        if (!nextRoiUpdate || nextRoiUpdate <= now) {
          // Calculate next ROI update (1 hour from now)
          const newNextRoiUpdate = new Date(now.getTime() + 60 * 60 * 1000);
          updates.nextRoiUpdate = newNextRoiUpdate;
          needsUpdate = true;
          
          console.log(`   🔧 Fixing nextRoiUpdate: ${nextRoiUpdate ? nextRoiUpdate.toISOString() : 'Not set'} → ${newNextRoiUpdate.toISOString()}`);
        }
        
        // Check if nextRoiCycleDate is missing or in the past
        if (!investment.nextRoiCycleDate || new Date(investment.nextRoiCycleDate) <= now) {
          // Calculate next ROI cycle (24 hours from now)
          const newNextRoiCycleDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          updates.nextRoiCycleDate = newNextRoiCycleDate;
          needsUpdate = true;
          
          console.log(`   🔧 Fixing nextRoiCycleDate: ${investment.nextRoiCycleDate ? new Date(investment.nextRoiCycleDate).toISOString() : 'Not set'} → ${newNextRoiCycleDate.toISOString()}`);
        }
        
        // Check if lastRoiUpdate is missing
        if (!investment.lastRoiUpdate) {
          updates.lastRoiUpdate = startDate;
          needsUpdate = true;
          
          console.log(`   🔧 Setting lastRoiUpdate: Not set → ${startDate.toISOString()}`);
        }
        
        // Update if needed
        if (needsUpdate) {
          await Investment.updateOne(
            { _id: investment._id },
            { $set: updates }
          );
          fixedCount++;
          console.log(`   ✅ Investment ${investment._id} countdowns fixed successfully`);
        } else {
          console.log(`   ✅ Investment ${investment._id} countdowns are already correct`);
        }
        
        console.log('');
        
      } catch (error) {
        console.error(`   ❌ Error processing investment ${investment._id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`🎯 Countdown fixes completed!`);
    console.log(`   ✅ Fixed: ${fixedCount} investments`);
    console.log(`   ❌ Errors: ${errorCount} investments`);
    console.log(`   📊 Total processed: ${investments.length} investments`);
    
  } catch (error) {
    console.error('❌ Error in fixCountdowns:', error);
  }
}

async function testCountdowns() {
  console.log('\n🧪 Testing countdowns after fixes...\n');
  
  try {
    const investments = await Investment.find({
      status: 'active',
      endDate: { $gt: new Date() }
    });
    
    for (const investment of investments) {
      const now = new Date();
      const nextRoiUpdate = new Date(investment.nextRoiUpdate);
      const nextRoiCycleDate = new Date(investment.nextRoiCycleDate);
      const lastRoiUpdate = new Date(investment.lastRoiUpdate);
      
      const timeToNextRoi = nextRoiUpdate.getTime() - now.getTime();
      const timeToNextCycle = nextRoiCycleDate.getTime() - now.getTime();
      
      console.log(`💰 Investment ${investment._id}:`);
      console.log(`   nextRoiUpdate: ${nextRoiUpdate.toISOString()} (${Math.floor(timeToNextRoi / 1000 / 60)}m ${Math.floor((timeToNextRoi / 1000) % 60)}s from now)`);
      console.log(`   nextRoiCycleDate: ${nextRoiCycleDate.toISOString()} (${Math.floor(timeToNextCycle / 1000 / 60 / 60)}h ${Math.floor((timeToNextCycle / 1000 / 60) % 60)}m from now)`);
      console.log(`   lastRoiUpdate: ${lastRoiUpdate.toISOString()}`);
      
      // Validate countdowns
      if (timeToNextRoi > 0 && timeToNextRoi <= 60 * 60 * 1000) {
        console.log(`   ✅ nextRoiUpdate countdown is valid (within 1 hour)`);
      } else {
        console.log(`   ❌ nextRoiUpdate countdown is invalid`);
      }
      
      if (timeToNextCycle > 0 && timeToNextCycle <= 24 * 60 * 60 * 1000) {
        console.log(`   ✅ nextRoiCycleDate countdown is valid (within 24 hours)`);
      } else {
        console.log(`   ❌ nextRoiCycleDate countdown is invalid`);
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error in testCountdowns:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await fixCountdowns();
    await testCountdowns();
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

module.exports = { fixCountdowns, testCountdowns };
