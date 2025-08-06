import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { Transaction } from '../transactions/schemas/transaction.schema';

async function cleanupDuplicateRoiTransactionsV2() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    console.log('🔄 Starting enhanced duplicate ROI transactions cleanup...');
    
    const transactionModel = app.get<Model<Transaction>>('TransactionModel');
    
    // Find all ROI transactions from the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const roiTransactions = await transactionModel.find({
      type: 'roi',
      status: 'success',
      createdAt: { $gte: oneDayAgo }
    }).sort({ createdAt: 1 });
    
    console.log(`📊 Found ${roiTransactions.length} ROI transactions from last 24 hours to check`);
    
    let deletedCount = 0;
    const processedGroups = new Map();
    
    for (const transaction of roiTransactions) {
      // Create a unique key for each investment-minute combination (more granular)
      const transactionDate = new Date(transaction.createdAt);
      const minuteKey = `${transaction.userId}-${transaction.investmentId}-${transactionDate.getFullYear()}-${transactionDate.getMonth()}-${transactionDate.getDate()}-${transactionDate.getHours()}-${transactionDate.getMinutes()}`;
      
      if (processedGroups.has(minuteKey)) {
        // This is a duplicate, delete it
        await transactionModel.findByIdAndDelete(transaction._id);
        deletedCount++;
        console.log(`🗑️ Deleted duplicate transaction: ${transaction._id} (${transaction.amount} ${transaction.currency}) at ${transactionDate.toISOString()}`);
      } else {
        // First occurrence, mark as processed
        processedGroups.set(minuteKey, transaction._id);
      }
    }
    
    console.log(`🎉 Enhanced cleanup completed! Deleted ${deletedCount} duplicate transactions`);
    
    // Also clean up any transactions with the same amount and investment within 5 minutes
    console.log('🔍 Performing additional cleanup for transactions within 5 minutes...');
    
    const allRoiTransactions = await transactionModel.find({
      type: 'roi',
      status: 'success'
    }).sort({ createdAt: 1 });
    
    let additionalDeletedCount = 0;
    const processedAmounts = new Map();
    
    for (const transaction of allRoiTransactions) {
      const key = `${transaction.userId}-${transaction.investmentId}-${transaction.amount}`;
      const transactionTime = new Date(transaction.createdAt).getTime();
      
      if (processedAmounts.has(key)) {
        const lastTime = processedAmounts.get(key);
        const timeDiff = Math.abs(transactionTime - lastTime);
        
        // If transactions are within 5 minutes of each other, delete the newer one
        if (timeDiff < 5 * 60 * 1000) {
          await transactionModel.findByIdAndDelete(transaction._id);
          additionalDeletedCount++;
          console.log(`🗑️ Deleted additional duplicate: ${transaction._id} (${transaction.amount} ${transaction.currency})`);
        } else {
          processedAmounts.set(key, transactionTime);
        }
      } else {
        processedAmounts.set(key, transactionTime);
      }
    }
    
    console.log(`🎉 Additional cleanup completed! Deleted ${additionalDeletedCount} more duplicate transactions`);
    console.log(`📊 Total duplicates removed: ${deletedCount + additionalDeletedCount}`);
    
  } catch (error) {
    console.error('❌ Enhanced cleanup failed:', error);
  } finally {
    await app.close();
  }
}

// Run the enhanced cleanup
cleanupDuplicateRoiTransactionsV2().catch(console.error); 