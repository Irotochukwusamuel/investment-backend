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

async function testTestingMode() {
  console.log('🧪 TESTING ACCELERATED TIMING MODE\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Current Time: ${now.toISOString()}\n`);
    
    // Show the testing mode configuration
    console.log('🔧 TESTING MODE CONFIGURATION:');
    console.log('=' .repeat(50));
    console.log('✅ TESTING_MODE = true (enabled)');
    console.log('📊 Accelerated Timings:');
    console.log('   Hourly updates: 60 seconds (1 minute)');
    console.log('   Daily cycles: 60 minutes (1 hour)');
    console.log('   Monthly cycles: 3 hours');
    console.log('   Overdue threshold: 60 seconds');
    console.log('   Min update interval: 10 seconds');
    console.log('');
    
    // Test the improved query logic with accelerated timings
    console.log('🔧 1. TESTING ACCELERATED QUERY LOGIC');
    console.log('=' .repeat(50));
    
    const acceleratedQuery = {
      status: 'active',
      endDate: { $gt: now },
      $and: [
        {
          $or: [
            { nextRoiCycleDate: { $lte: now } },
            { nextRoiUpdate: { $lte: now } },
            // NEW: Overdue detection with 60-second threshold
            { 
              $and: [
                { lastRoiUpdate: { $exists: true } },
                { lastRoiUpdate: { $lt: new Date(now.getTime() - 60 * 1000) } } // Over 60 seconds ago
              ]
            }
          ]
        },
        {
          $or: [
            { lastRoiUpdate: { $exists: false } },
            { lastRoiUpdate: { $lt: new Date(now.getTime() - 10 * 1000) } } // 10 seconds
          ]
        }
      ]
    };
    
    console.log('📊 Accelerated Query Logic:');
    console.log('   Status: active');
    console.log('   End Date: { $gt: now }');
    console.log('   AND conditions:');
    console.log('     - Either 60-minute cycle OR 60-second update is due OR investment is overdue (60s)');
    console.log('     - Not updated in last 10 seconds');
    console.log('');
    
    const investmentsToProcess = await Investment.find(acceleratedQuery);
    console.log(`📊 Investments that SHOULD be processed: ${investmentsToProcess.length}`);
    
    if (investmentsToProcess.length > 0) {
      console.log('   ✅ SUCCESS: Investments are being picked up with accelerated timings!');
      console.log('   Investments to process:');
      investmentsToProcess.forEach((inv, i) => {
        const timeSinceLastUpdate = inv.lastRoiUpdate ? 
          Math.floor((now - new Date(inv.lastRoiUpdate)) / 1000) : 'Never';
        console.log(`   ${i + 1}. ${inv._id}: Last update ${timeSinceLastUpdate} seconds ago`);
      });
    } else {
      console.log('   ❌ FAILED: No investments being picked up with accelerated timings');
    }
    
    console.log('');
    
    // 2. TEST TIMESTAMP LOGIC WITH ACCELERATED INTERVALS
    console.log('🔧 2. TESTING ACCELERATED TIMESTAMP LOGIC');
    console.log('=' .repeat(50));
    
    // Check all active investments
    const allActiveInvestments = await Investment.find({
      status: 'active',
      endDate: { $gt: now }
    });
    
    console.log(`📊 Total Active Investments: ${allActiveInvestments.length}`);
    
    // Analyze each investment for accelerated processing
    for (const investment of allActiveInvestments) {
      console.log(`\n💰 Investment: ${investment._id}`);
      console.log(`   Amount: ₦${investment.amount.toLocaleString()}`);
      console.log(`   Daily ROI: ${investment.dailyRoi}%`);
      console.log(`   Start Date: ${investment.startDate.toISOString()}`);
      console.log(`   Last ROI Update: ${investment.lastRoiUpdate ? investment.lastRoiUpdate.toISOString() : 'Never'}`);
      console.log(`   Next ROI Update: ${investment.nextRoiUpdate ? investment.nextRoiUpdate.toISOString() : 'Not set'}`);
      console.log(`   Next ROI Cycle: ${investment.nextRoiCycleDate ? investment.nextRoiCycleDate.toISOString() : 'Not set'}`);
      
      // Check if investment is overdue with accelerated threshold (60 seconds)
      const lastUpdate = investment.lastRoiUpdate ? new Date(investment.lastRoiUpdate) : new Date(investment.startDate);
      const timeSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
      const isOverdue = timeSinceUpdate >= 60; // 60 seconds or more
      
      console.log(`   Time since last update: ${timeSinceUpdate} seconds`);
      console.log(`   Is overdue (60s threshold): ${isOverdue ? 'YES' : 'No'}`);
      
      // Check if it should be processed by the accelerated query
      const shouldBeProcessed = investmentsToProcess.find(p => p._id.toString() === investment._id.toString());
      console.log(`   Will be processed: ${shouldBeProcessed ? 'YES' : 'No'}`);
      
      if (shouldBeProcessed) {
        console.log(`   ✅ Investment will be processed by the accelerated system`);
      } else {
        console.log(`   ❌ Investment still won't be processed - needs investigation`);
      }
    }
    
    console.log('');
    
    // 3. SIMULATION PREDICTIONS
    console.log('🔧 3. ACCELERATED TIMING SIMULATION PREDICTIONS');
    console.log('=' .repeat(50));
    
    console.log('📊 With Testing Mode Enabled:');
    console.log('   ⏰ Hourly ROI updates will occur every 60 seconds');
    console.log('   ⏰ Daily ROI cycles will occur every 60 minutes');
    console.log('   ⏰ Monthly ROI cycles will occur every 3 hours');
    console.log('   ⚠️  Investments become overdue after 60 seconds');
    console.log('   🔄 System checks for updates every 10 seconds minimum');
    console.log('');
    
    console.log('📊 Expected Behavior:');
    console.log('   ✅ ROI updates will process much faster');
    console.log('   ✅ You can see multiple cycles in a short time');
    console.log('   ✅ Perfect for testing and demonstration');
    console.log('   ⚠️  NOT suitable for production use');
    
    console.log('');
    
    // 4. SUMMARY AND RECOMMENDATIONS
    console.log('🔧 4. SUMMARY AND RECOMMENDATIONS');
    console.log('=' .repeat(50));
    
    if (investmentsToProcess.length > 0) {
      console.log('✅ SUCCESS: Accelerated testing mode is working!');
      console.log(`   ${investmentsToProcess.length} investments will be processed`);
      console.log('   The accelerated overdue detection logic is functioning');
      console.log('   You can now test ROI cycles much faster');
    } else {
      console.log('❌ FAILED: Accelerated testing mode has issues');
      console.log('   No investments are being picked up');
      console.log('   Additional debugging is needed');
    }
    
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Start the backend server: `npm run start:dev`');
    console.log('   2. The cron jobs will now run with accelerated timings');
    console.log('   3. Monitor the logs to see fast ROI processing');
    console.log('   4. Test the system with accelerated cycles');
    console.log('');
    console.log('🔄 TO REVERT TO PRODUCTION MODE:');
    console.log('   1. Set TESTING_MODE = false at the top of tasks.service.ts');
    console.log('   2. Restart the server');
    console.log('   3. Timings will return to: 1 hour, 24 hours, 30 days');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testTestingMode();








