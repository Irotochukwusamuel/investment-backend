import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { Investment } from '../investments/schemas/investment.schema';

async function resetDailyRoiEarnings() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    console.log('🔄 Starting daily ROI earnings reset...');
    
    const investmentModel = app.get<Model<Investment>>('InvestmentModel');
    
    // Get all active investments
    const activeInvestments = await investmentModel.find({
      status: 'active'
    });
    
    console.log(`📊 Found ${activeInvestments.length} active investments to reset`);
    
    let resetCount = 0;
    
    for (const investment of activeInvestments) {
      // Calculate today's earnings based on hours since start of day
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const hoursSinceStartOfDay = (now.getTime() - startOfDay.getTime()) / (1000 * 60 * 60);
      
      // Calculate daily ROI amount
      const dailyRoiAmount = (investment.amount * investment.dailyRoi) / 100;
      const hourlyRoiAmount = dailyRoiAmount / 24;
      
      // Calculate today's earnings (capped at daily amount)
      const todaysEarnings = Math.min(hoursSinceStartOfDay * hourlyRoiAmount, dailyRoiAmount);
      
      // Reset earnedAmount to today's earnings only
      await investmentModel.findByIdAndUpdate(
        investment._id,
        { 
          $set: { 
            earnedAmount: todaysEarnings,
            lastRoiUpdate: now
          }
        }
      );
      
      resetCount++;
      console.log(`✅ Reset investment ${investment._id}: earnedAmount=${todaysEarnings.toFixed(2)} (was ${investment.earnedAmount})`);
    }
    
    console.log(`🎉 Reset completed! Updated ${resetCount} investments`);
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
  } finally {
    await app.close();
  }
}

// Run the reset
resetDailyRoiEarnings().catch(console.error); 