import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { WalletService } from '../wallet/wallet.service';
import { Model } from 'mongoose';
import { Wallet } from '../wallet/schemas/wallet.schema';
import { InjectModel } from '@nestjs/mongoose';

async function migrateWalletBonuses() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    console.log('🔄 Starting wallet bonus migration...');
    
    const walletModel = app.get<Model<Wallet>>('WalletModel');
    
    // Get all wallets
    const wallets = await walletModel.find({});
    console.log(`📊 Found ${wallets.length} wallets to migrate`);
    
    let migratedCount = 0;
    
    for (const wallet of wallets) {
      // Initialize new fields if they don't exist
      if (wallet.lockedNairaWelcomeBonuses === undefined) {
        wallet.lockedNairaWelcomeBonuses = 0;
      }
      if (wallet.lockedUsdtWelcomeBonuses === undefined) {
        wallet.lockedUsdtWelcomeBonuses = 0;
      }
      if (wallet.lockedNairaReferralBonuses === undefined) {
        wallet.lockedNairaReferralBonuses = 0;
      }
      if (wallet.lockedUsdtReferralBonuses === undefined) {
        wallet.lockedUsdtReferralBonuses = 0;
      }
      
      // For existing wallets, we'll set the welcome bonus to 0 and referral bonus to the total
      // This is a conservative approach - users can see their actual bonuses after the next investment
      if (wallet.lockedNairaBonuses > 0) {
        // For now, we'll assume all existing bonuses are referral bonuses
        // This is a safe assumption since welcome bonuses are only given on first investment
        wallet.lockedNairaReferralBonuses = wallet.lockedNairaBonuses;
      }
      
      if (wallet.lockedUsdtBonuses > 0) {
        wallet.lockedUsdtReferralBonuses = wallet.lockedUsdtBonuses;
      }
      
      await wallet.save();
      migratedCount++;
      
      if (migratedCount % 10 === 0) {
        console.log(`✅ Migrated ${migratedCount} wallets...`);
      }
    }
    
    console.log(`🎉 Successfully migrated ${migratedCount} wallets!`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await app.close();
  }
}

migrateWalletBonuses(); 