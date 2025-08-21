const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/investment', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the Investment schema inline since we can't import the compiled version
const investmentSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  planId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  currency: String,
  dailyRoi: Number,
  totalRoi: Number,
  duration: Number,
  startDate: Date,
  endDate: Date,
  activatedAt: Date,
  nextRoiCycleDate: Date,
  earnedAmount: Number,
  totalAccumulatedRoi: Number,
  expectedReturn: Number,
  status: String,
  createdAt: Date,
  updatedAt: Date
});

const Investment = mongoose.model('Investment', investmentSchema);

async function migrateTo24HourRoiCycles() {
  try {
    console.log('🚀 Starting migration to 24-hour ROI cycles...');
    
    // Find all active investments that don't have the new fields
    const investmentsToUpdate = await Investment.find({
      $or: [
        { activatedAt: { $exists: false } },
        { nextRoiCycleDate: { $exists: false } }
      ],
      status: 'active'
    });
    
    console.log(`📊 Found ${investmentsToUpdate.length} investments to migrate`);
    
    let updatedCount = 0;
    for (const investment of investmentsToUpdate) {
      try {
        // Set activatedAt to startDate if it exists, otherwise to createdAt
        const activatedAt = investment.startDate || investment.createdAt || new Date();
        
        // Calculate next ROI cycle date (24 hours from now)
        const nextRoiCycleDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        // Update the investment
        await Investment.findByIdAndUpdate(investment._id, {
          $set: {
            activatedAt,
            nextRoiCycleDate
          }
        });
        
        updatedCount++;
        console.log(`✅ Updated investment ${investment._id}: activatedAt=${activatedAt}, nextRoiCycleDate=${nextRoiCycleDate}`);
        
      } catch (error) {
        console.error(`❌ Error updating investment ${investment._id}:`, error);
      }
    }
    
    console.log(`🎯 Migration completed: ${updatedCount}/${investmentsToUpdate.length} investments updated`);
    
    // Verify the migration
    const remainingInvestments = await Investment.find({
      $or: [
        { activatedAt: { $exists: false } },
        { nextRoiCycleDate: { $exists: false } }
      ],
      status: 'active'
    });
    
    if (remainingInvestments.length === 0) {
      console.log('✅ All investments have been successfully migrated!');
    } else {
      console.log(`⚠️ ${remainingInvestments.length} investments still need migration`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
migrateTo24HourRoiCycles();
