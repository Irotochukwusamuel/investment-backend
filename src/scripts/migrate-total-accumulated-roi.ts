import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { Investment } from '../investments/schemas/investment.schema';
import { InjectModel } from '@nestjs/mongoose';

async function migrateTotalAccumulatedRoi() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    console.log('🔄 Starting total accumulated ROI migration...');
    
    const investmentModel = app.get<Model<Investment>>('InvestmentModel');
    
    // Get all investments
    const investments = await investmentModel.find({});
    console.log(`📊 Found ${investments.length} investments to migrate`);
    
    let migratedCount = 0;
    
    for (const investment of investments) {
      // Initialize totalAccumulatedRoi to earnedAmount if not set
      if (typeof investment.totalAccumulatedRoi === 'undefined' || investment.totalAccumulatedRoi === 0) {
        await investmentModel.findByIdAndUpdate(
          investment._id,
          { 
            $set: { 
              totalAccumulatedRoi: investment.earnedAmount || 0
            }
          }
        );
        migratedCount++;
        console.log(`✅ Migrated investment ${investment._id}: earnedAmount=${investment.earnedAmount}, totalAccumulatedRoi=${investment.earnedAmount}`);
      }
    }
    
    console.log(`🎉 Migration completed! Migrated ${migratedCount} investments`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await app.close();
  }
}

// Run the migration
migrateTotalAccumulatedRoi().catch(console.error); 