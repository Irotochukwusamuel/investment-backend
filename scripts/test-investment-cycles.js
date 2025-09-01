const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/investment-app')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Test investment ID - replace with an actual active investment ID from your database
const TEST_INVESTMENT_ID = '68ac78ac268992c37013690d'; // Replace with actual ID

// Base URL for your API
const BASE_URL = 'http://localhost:3000'; // Adjust if your API runs on different port

// Admin token - you'll need to get this from your admin login
const ADMIN_TOKEN = 'YOUR_ADMIN_JWT_TOKEN_HERE'; // Replace with actual admin token

async function testInvestmentCycles() {
  console.log('🧪 Testing Investment Cycles...\n');

  try {
    // Test 1: Hourly Cycle
    console.log('1️⃣ Testing Hourly ROI Cycle...');
    const hourlyResponse = await fetch(`${BASE_URL}/admin/investments/${TEST_INVESTMENT_ID}/test-hourly-cycle`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (hourlyResponse.ok) {
      const hourlyData = await hourlyResponse.json();
      console.log('✅ Hourly cycle test successful');
      console.log(`   Added ROI: ${hourlyData.hourlyRoiAdded}`);
      console.log(`   New earned amount: ${hourlyData.newEarnedAmount}`);
    } else {
      console.log('❌ Hourly cycle test failed:', hourlyResponse.status);
    }

    console.log('\n2️⃣ Testing Daily ROI Cycle...');
    const dailyResponse = await fetch(`${BASE_URL}/admin/investments/${TEST_INVESTMENT_ID}/test-daily-cycle`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (dailyResponse.ok) {
      const dailyData = await dailyResponse.json();
      console.log('✅ Daily cycle test successful');
      console.log(`   Transferred: ${dailyData.cycleEarningsTransferred}`);
      console.log(`   New total accumulated ROI: ${dailyData.newTotalAccumulatedRoi}`);
    } else {
      console.log('❌ Daily cycle test failed:', dailyResponse.status);
    }

    console.log('\n3️⃣ Testing End of Investment...');
    const endResponse = await fetch(`${BASE_URL}/admin/investments/${TEST_INVESTMENT_ID}/test-end-investment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (endResponse.ok) {
      const endData = await endResponse.json();
      console.log('✅ Investment end test successful');
      console.log(`   Total earnings transferred: ${endData.totalEarningsTransferred}`);
      console.log(`   Final return amount: ${endData.finalReturnAmount}`);
      console.log(`   Investment status: ${endData.investment.status}`);
    } else {
      console.log('❌ Investment end test failed:', endResponse.status);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('\n🎯 Test completed!');
  console.log('\n📝 Notes:');
  console.log('   - Make sure to replace TEST_INVESTMENT_ID with an actual active investment ID');
  console.log('   - Make sure to replace ADMIN_TOKEN with a valid admin JWT token');
  console.log('   - Ensure your backend API is running on the correct port');
  console.log('   - These tests will modify the actual investment data in your database');
  
  process.exit(0);
}

// Run the test
testInvestmentCycles();


