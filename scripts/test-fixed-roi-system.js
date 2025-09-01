import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/investment';
await mongoose.connect(MONGODB_URI);
console.log('✅ Connected to MongoDB');

// Define schemas
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
  earnedAmount: Number,
  totalAccumulatedRoi: Number,
  expectedReturn: Number,
  lastRoiUpdate: Date,
  nextRoiUpdate: Date,
  nextRoiCycleDate: Date
});

const Investment = mongoose.model('Investment', investmentSchema);

async function testFixedRoiSystem() {
  console.log('🧪 TESTING FIXED ROI UPDATE SYSTEM\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Current Time: ${now.toISOString()}\n`);
    
    // Test the improved query logic that should now pick up overdue investments
    console.log('🔧 1. TESTING IMPROVED QUERY LOGIC');
    console.log('=' .repeat(50));
    
    const improvedQuery = {
      status: 'active',
      endDate: { $gt: now },
      $and: [
        {
          $or: [
            { nextRoiCycleDate: { $lte: now } },
            { nextRoiUpdate: { $lte: now } },
            // NEW: Overdue detection
            { 
              $and: [
                { lastRoiUpdate: { $exists: true } },
                { lastRoiUpdate: { $lt: new Date(now.getTime() - 60 * 60 * 1000) } } // Over 1 hour ago
              ]
            }
          ]
        },
        {
          $or: [
            { lastRoiUpdate: { $exists: false } },
            { lastRoiUpdate: { $lt: new Date(now.getTime() - 30 * 1000) } }
          ]
        }
      ]
    };
    
    console.log('📊 Improved Query Logic:');
    console.log('   Status: active');
    console.log('   End Date: { $gt: now }');
    console.log('   AND conditions:');
    console.log('     - Either 24-hour cycle OR hourly update is due OR investment is overdue');
    console.log('     - Not updated in last 30 seconds');
    console.log('');
    
    const investmentsToProcess = await Investment.find(improvedQuery);
    console.log(`📊 Investments that SHOULD be processed: ${investmentsToProcess.length}`);
    
    if (investmentsToProcess.length > 0) {
      console.log('   ✅ SUCCESS: Investments are now being picked up!');
      console.log('   Investments to process:');
      investmentsToProcess.forEach((inv, i) => {
        const timeSinceLastUpdate = inv.lastRoiUpdate ? 
          Math.floor((now - new Date(inv.lastRoiUpdate)) / (1000 * 60)) : 'Never';
        console.log(`   ${i + 1}. ${inv._id}: Last update ${timeSinceLastUpdate} minutes ago`);
      });
    } else {
      console.log('   ❌ FAILED: Still no investments being picked up');
    }
    
    console.log('');
    
    // 2. TEST TIMESTAMP LOGIC
    console.log('🔧 2. TESTING TIMESTAMP LOGIC');
    console.log('=' .repeat(50));
    
    // Check all active investments
    const allActiveInvestments = await Investment.find({
      status: 'active',
      endDate: { $gt: now }
    });
    
    console.log(`📊 Total Active Investments: ${allActiveInvestments.length}`);
    
    // Analyze each investment
    for (const investment of allActiveInvestments) {
      console.log(`\n💰 Investment: ${investment._id}`);
      console.log(`   Amount: ₦${investment.amount.toLocaleString()}`);
      console.log(`   Daily ROI: ${investment.dailyRoi}%`);
      console.log(`   Start Date: ${investment.startDate.toISOString()}`);
      console.log(`   Last ROI Update: ${investment.lastRoiUpdate ? investment.lastRoiUpdate.toISOString() : 'Never'}`);
      console.log(`   Next ROI Update: ${investment.nextRoiUpdate ? investment.nextRoiUpdate.toISOString() : 'Not set'}`);
      console.log(`   Next ROI Cycle: ${investment.nextRoiCycleDate ? investment.nextRoiCycleDate.toISOString() : 'Not set'}`);
      
      // Check if investment is overdue
      const lastUpdate = investment.lastRoiUpdate ? new Date(investment.lastRoiUpdate) : new Date(investment.startDate);
      const timeSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));
      const isOverdue = timeSinceUpdate >= 60; // 1 hour or more
      
      console.log(`   Time since last update: ${timeSinceUpdate} minutes`);
      console.log(`   Is overdue: ${isOverdue ? 'YES' : 'No'}`);
      
      // Check if it should be processed by the improved query
      const shouldBeProcessed = investmentsToProcess.find(p => p._id.toString() === investment._id.toString());
      console.log(`   Will be processed: ${shouldBeProcessed ? 'YES' : 'No'}`);
      
      if (shouldBeProcessed) {
        console.log(`   ✅ Investment will be processed by the fixed system`);
      } else {
        console.log(`   ❌ Investment still won't be processed - needs investigation`);
      }
    }
    
    console.log('');
    
    // 3. SUMMARY
    console.log('🔧 3. TEST RESULTS SUMMARY');
    console.log('=' .repeat(50));
    
    if (investmentsToProcess.length > 0) {
      console.log('✅ SUCCESS: The fixed ROI system is working!');
      console.log(`   ${investmentsToProcess.length} investments will be processed`);
      console.log('   The overdue detection logic is now functioning');
    } else {
      console.log('❌ FAILED: The ROI system still has issues');
      console.log('   No investments are being picked up');
      console.log('   Additional debugging is needed');
    }
    
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Start the backend server: `npm run start:dev`');
    console.log('   2. The cron jobs should now pick up overdue investments');
    console.log('   3. Monitor the logs to see investments being processed');
    console.log('   4. Check that timestamps are being updated correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testFixedRoiSystem();

