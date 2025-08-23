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

// Add virtual fields
investmentSchema.virtual('progressPercentage').get(function() {
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const percentage = (elapsed / totalDuration) * 100;
  return Math.min(100, Math.max(0, percentage));
});

investmentSchema.virtual('progress').get(function() {
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const percentage = (elapsed / totalDuration) * 100;
  return Math.min(100, Math.max(0, percentage));
});

// Ensure virtual fields are serialized
investmentSchema.set('toJSON', { virtuals: true });
investmentSchema.set('toObject', { virtuals: true });

const Investment = mongoose.model('Investment', investmentSchema);

async function testProgressCalculation() {
  console.log('🧪 TESTING PROGRESS CALCULATION\n');
  console.log('=' .repeat(80));
  
  try {
    const now = new Date();
    console.log(`📅 Current Time: ${now.toISOString()}\n`);
    
    // Get all active investments
    const activeInvestments = await Investment.find({
      status: 'active',
      endDate: { $gt: now }
    }).sort({ startDate: 1 });
    
    console.log(`📊 Found ${activeInvestments.length} active investments to test\n`);
    
    for (const investment of activeInvestments) {
      console.log('=' .repeat(60));
      console.log(`💰 INVESTMENT: ${investment._id}`);
      console.log('=' .repeat(60));
      
      const startDate = new Date(investment.startDate);
      const endDate = new Date(investment.endDate);
      
      // Calculate progress manually
      const totalDuration = endDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      const manualProgress = (elapsed / totalDuration) * 100;
      const clampedProgress = Math.min(100, Math.max(0, manualProgress));
      
      // Get progress from virtual fields
      const progressPercentage = investment.progressPercentage;
      const progress = investment.progress;
      
      console.log('📊 DATES:');
      console.log(`   Start Date: ${startDate.toISOString()}`);
      console.log(`   End Date: ${endDate.toISOString()}`);
      console.log(`   Current Time: ${now.toISOString()}`);
      console.log('');
      
      console.log('⏰ TIME CALCULATIONS:');
      console.log(`   Total Duration: ${totalDuration}ms (${Math.floor(totalDuration / (1000 * 60 * 60 * 24))} days)`);
      console.log(`   Elapsed Time: ${elapsed}ms (${Math.floor(elapsed / (1000 * 60 * 60 * 24))} days)`);
      console.log('');
      
      console.log('📈 PROGRESS CALCULATIONS:');
      console.log(`   Manual Progress: ${manualProgress.toFixed(2)}%`);
      console.log(`   Clamped Progress: ${clampedProgress.toFixed(2)}%`);
      console.log(`   Virtual progressPercentage: ${progressPercentage?.toFixed(2) || 'undefined'}%`);
      console.log(`   Virtual progress: ${progress?.toFixed(2) || 'undefined'}%`);
      console.log('');
      
      // Check if virtual fields are working
      if (progressPercentage !== undefined && progress !== undefined) {
        console.log('✅ VIRTUAL FIELDS WORKING CORRECTLY');
        console.log(`   progressPercentage: ${progressPercentage.toFixed(2)}%`);
        console.log(`   progress: ${progress.toFixed(2)}%`);
      } else {
        console.log('❌ VIRTUAL FIELDS NOT WORKING');
        console.log(`   progressPercentage: ${progressPercentage}`);
        console.log(`   progress: ${progress}`);
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error testing progress calculation:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await testProgressCalculation();
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

module.exports = { testProgressCalculation };
