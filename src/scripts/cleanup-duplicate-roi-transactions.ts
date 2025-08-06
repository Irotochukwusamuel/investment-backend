import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { Transaction } from '../transactions/schemas/transaction.schema';

async function cleanupDuplicateRoiTransactions() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    console.log('🔄 Starting duplicate ROI transactions cleanup...');
    
    const transactionModel = app.get<Model<Transaction>>('TransactionModel');
    
    // Find all ROI transactions
    const roiTransactions = await transactionModel.find({
      type: 'roi',
      status: 'success'
    }).sort({ createdAt: 1 });
    
    console.log(`📊 Found ${roiTransactions.length} ROI transactions to check`);
    
    let deletedCount = 0;
    const processedGroups = new Map();
    
    for (const transaction of roiTransactions) {
      // Create a unique key for each investment-hour combination
      const key = `${transaction.userId}-${transaction.investmentId}-${transaction.amount}-${transaction.currency}`;
      
      if (processedGroups.has(key)) {
        // This is a duplicate, delete it
        await transactionModel.findByIdAndDelete(transaction._id);
        deletedCount++;
        console.log(`🗑️ Deleted duplicate transaction: ${transaction._id} (${transaction.amount} ${transaction.currency})`);
      } else {
        // First occurrence, mark as processed
        processedGroups.set(key, transaction._id);
      }
    }
    
    console.log(`🎉 Cleanup completed! Deleted ${deletedCount} duplicate transactions`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await app.close();
  }
}

// Run the cleanup
cleanupDuplicateRoiTransactions().catch(console.error); 