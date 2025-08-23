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

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  investmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment' },
  type: String,
  amount: Number,
  currency: String,
  status: String,
  createdAt: Date
});

const Investment = mongoose.model('Investment', investmentSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

async function fixRoiCalculations() {
  console.log('🔄 Starting ROI calculations fix...');
  
  try {
    // Get all investments
    const investments = await Investment.find({
      status: { $in: ['active', 'completed'] }
    });
    
    console.log(`📊 Found ${investments.length} investments to process`);
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const investment of investments) {
      try {
        console.log(`\n💰 Processing investment ${investment._id}`);
        
        // Get all ROI transactions for this investment
        const roiTransactions = await Transaction.find({
          investmentId: investment._id,
          type: 'roi',
          status: 'completed'
        });
        
        // Calculate total accumulated ROI from transaction history
        const totalRoiFromTransactions = roiTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        
        console.log(`   Current totalAccumulatedRoi: ${investment.totalAccumulatedRoi || 0}`);
        console.log(`   Total ROI from transactions: ${totalRoiFromTransactions}`);
        console.log(`   Current earnedAmount: ${investment.earnedAmount || 0}`);
        
        let needsUpdate = false;
        const updates = {};
        
        // Fix totalAccumulatedRoi if it differs from transaction history
        if (Math.abs((investment.totalAccumulatedRoi || 0) - totalRoiFromTransactions) > 0.01) {
          updates.totalAccumulatedRoi = totalRoiFromTransactions;
          needsUpdate = true;
          console.log(`   🔧 Fixing totalAccumulatedRoi: ${investment.totalAccumulatedRoi || 0} → ${totalRoiFromTransactions}`);
        }
        
        // Ensure earnedAmount is not negative
        if ((investment.earnedAmount || 0) < 0) {
          updates.earnedAmount = 0;
          needsUpdate = true;
          console.log(`   🔧 Fixing negative earnedAmount: ${investment.earnedAmount} → 0`);
        }
        
        // Update if needed
        if (needsUpdate) {
          await Investment.updateOne(
            { _id: investment._id },
            { $set: updates }
          );
          fixedCount++;
          console.log(`   ✅ Investment ${investment._id} updated successfully`);
        } else {
          console.log(`   ✅ Investment ${investment._id} is already correct`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing investment ${investment._id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎯 ROI calculations fix completed!`);
    console.log(`   ✅ Fixed: ${fixedCount} investments`);
    console.log(`   ❌ Errors: ${errorCount} investments`);
    console.log(`   📊 Total processed: ${investments.length} investments`);
    
  } catch (error) {
    console.error('❌ Error in fixRoiCalculations:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await fixRoiCalculations();
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

module.exports = { fixRoiCalculations };
