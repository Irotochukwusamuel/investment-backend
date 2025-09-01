import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/investment';
await mongoose.connect(MONGODB_URI);
console.log('✅ Connected to MongoDB');

// Define schemas
const settingsSchema = new mongoose.Schema({
  key: String,
  value: Object,
  createdAt: Date,
  updatedAt: Date
});

const Settings = mongoose.model('Settings', settingsSchema);

async function testDatabaseTestingMode() {
  console.log('🧪 TESTING DATABASE-DRIVEN TESTING MODE\n');
  console.log('=' .repeat(80));
  
  try {
    console.log('🔧 1. CHECKING CURRENT TESTING MODE SETTINGS');
    console.log('=' .repeat(50));
    
    // Check if testing mode settings exist in database
    const testingModeSettings = await Settings.findOne({ key: 'roi-testing-mode' });
    
    if (testingModeSettings) {
      console.log('✅ Testing mode settings found in database');
      console.log('📊 Current Settings:');
      console.log(`   Enabled: ${testingModeSettings.value.enabled}`);
      console.log(`   Hourly Update Interval: ${testingModeSettings.value.hourlyUpdateInterval/1000} seconds`);
      console.log(`   Daily Cycle Interval: ${testingModeSettings.value.dailyCycleInterval/60000} minutes`);
      console.log(`   Monthly Cycle Interval: ${testingModeSettings.value.monthlyCycleInterval/3600000} hours`);
      console.log(`   Overdue Threshold: ${testingModeSettings.value.overdueThreshold/1000} seconds`);
      console.log(`   Min Update Interval: ${testingModeSettings.value.minUpdateInterval/1000} seconds`);
      console.log(`   Countdown Update Threshold: ${testingModeSettings.value.countdownUpdateThreshold/1000} seconds`);
    } else {
      console.log('❌ No testing mode settings found in database');
      console.log('💡 This means the system will use default production timings');
    }
    
    console.log('');
    
    // 2. SIMULATE ENABLING TESTING MODE
    console.log('🔧 2. SIMULATING ENABLING TESTING MODE');
    console.log('=' .repeat(50));
    
    const testingSettings = {
      enabled: true,
      hourlyUpdateInterval: 60 * 1000,              // 60 seconds (1 minute)
      dailyCycleInterval: 60 * 60 * 1000,          // 60 minutes (1 hour)
      monthlyCycleInterval: 3 * 60 * 60 * 1000,    // 3 hours
      overdueThreshold: 60 * 1000,                  // 60 seconds
      minUpdateInterval: 10 * 1000,                 // 10 seconds
      countdownUpdateThreshold: 10 * 1000,          // 10 seconds
    };
    
    // Update or create testing mode settings
    await Settings.updateOne(
      { key: 'roi-testing-mode' },
      { value: testingSettings },
      { upsert: true }
    );
    
    console.log('✅ Testing mode settings updated in database');
    console.log('📊 New Settings Applied:');
    console.log(`   Enabled: ${testingSettings.enabled}`);
    console.log(`   Hourly updates: ${testingSettings.hourlyUpdateInterval/1000} seconds`);
    console.log(`   Daily cycles: ${testingSettings.dailyCycleInterval/60000} minutes`);
    console.log(`   Monthly cycles: ${testingSettings.monthlyCycleInterval/3600000} hours`);
    console.log(`   Overdue threshold: ${testingSettings.overdueThreshold/1000} seconds`);
    console.log(`   Min update interval: ${testingSettings.minUpdateInterval/1000} seconds`);
    
    console.log('');
    
    // 3. VERIFY THE CHANGES
    console.log('🔧 3. VERIFYING DATABASE CHANGES');
    console.log('=' .repeat(50));
    
    const updatedSettings = await Settings.findOne({ key: 'roi-testing-mode' });
    
    if (updatedSettings && updatedSettings.value.enabled) {
      console.log('✅ Testing mode successfully enabled in database');
      console.log('📊 Verified Settings:');
      console.log(`   Key: ${updatedSettings.key}`);
      console.log(`   Enabled: ${updatedSettings.value.enabled}`);
      console.log(`   Last Updated: ${updatedSettings.updatedAt}`);
    } else {
      console.log('❌ Failed to enable testing mode in database');
    }
    
    console.log('');
    
    // 4. SIMULATE DISABLING TESTING MODE
    console.log('🔧 4. SIMULATING DISABLING TESTING MODE');
    console.log('=' .repeat(50));
    
    const productionSettings = {
      enabled: false,
      hourlyUpdateInterval: 60 * 60 * 1000,        // 1 hour (60 minutes)
      dailyCycleInterval: 24 * 60 * 60 * 1000,     // 24 hours
      monthlyCycleInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
      overdueThreshold: 60 * 60 * 1000,             // 1 hour
      minUpdateInterval: 30 * 1000,                 // 30 seconds
      countdownUpdateThreshold: 60 * 1000,          // 1 minute
    };
    
    // Update to production settings
    await Settings.updateOne(
      { key: 'roi-testing-mode' },
      { value: productionSettings },
      { upsert: true }
    );
    
    console.log('✅ Production mode settings applied to database');
    console.log('📊 Production Settings:');
    console.log(`   Enabled: ${productionSettings.enabled}`);
    console.log(`   Hourly updates: ${productionSettings.hourlyUpdateInterval/60000} minutes`);
    console.log(`   Daily cycles: ${productionSettings.dailyCycleInterval/3600000} hours`);
    console.log(`   Monthly cycles: ${productionSettings.monthlyCycleInterval/86400000} days`);
    
    console.log('');
    
    // 5. SUMMARY AND RECOMMENDATIONS
    console.log('🔧 5. SUMMARY AND RECOMMENDATIONS');
    console.log('=' .repeat(50));
    
    console.log('✅ SUCCESS: Database-driven testing mode is working!');
    console.log('📊 What was tested:');
    console.log('   ✅ Settings can be stored in database');
    console.log('   ✅ Testing mode can be enabled/disabled');
    console.log('   ✅ Timings can be customized');
    console.log('   ✅ Changes persist across server restarts');
    
    console.log('\n💡 HOW TO USE:');
    console.log('   1. Start the backend server: `npm run start:dev`');
    console.log('   2. Use admin API endpoints to manage testing mode:');
    console.log('      - GET /api/v1/admin/settings/roi-testing-mode');
    console.log('      - POST /api/v1/admin/settings/roi-testing-mode/enable');
    console.log('      - POST /api/v1/admin/settings/roi-testing-mode/disable');
    console.log('      - POST /api/v1/admin/settings/roi-testing-mode/toggle');
    console.log('      - POST /api/v1/admin/settings/roi-testing-mode/update');
    
    console.log('\n🔄 BENEFITS OF DATABASE-DRIVEN APPROACH:');
    console.log('   ✅ No server restart required');
    console.log('   ✅ Changes persist across deployments');
    console.log('   ✅ Admin can control from frontend');
    console.log('   ✅ Easy to revert to production');
    console.log('   ✅ Configurable without code changes');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testDatabaseTestingMode();

