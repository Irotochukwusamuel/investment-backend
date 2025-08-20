const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixUserAccountIssues(email) {
  let client;
  
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/investment';
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db();
    
    console.log(`🔧 Fixing issues for account: ${email}`);
    console.log('=' .repeat(60));

    // Find user
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`👤 User: ${user.firstName} ${user.lastName} (${user._id})`);
    console.log('');

    // 1. Fix ROI Accumulation Issue
    console.log(`🔧 Fixing ROI Accumulation Issue...`);
    
    const investments = await db.collection('investments').find({ userId: user._id }).toArray();
    
    for (const investment of investments) {
      if (investment.status === 'active') {
        // Calculate total ROI from transactions
        const roiTransactions = await db.collection('transactions').find({
          userId: user._id,
          type: 'roi',
          status: 'success'
        }).toArray();
        
        const totalRoiPaid = roiTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        
        console.log(`   Investment ${investment._id}:`);
        console.log(`     Current accumulatedRoi: ${investment.accumulatedRoi || 0}`);
        console.log(`     Total ROI from transactions: ${totalRoiPaid}`);
        
        // Update the investment with correct accumulated ROI
        const updateResult = await db.collection('investments').updateOne(
          { _id: investment._id },
          { 
            $set: { 
              accumulatedRoi: totalRoiPaid,
              dailyRoiEarnings: totalRoiPaid
            }
          }
        );
        
        if (updateResult.modifiedCount > 0) {
          console.log(`     ✅ Updated accumulatedRoi to ${totalRoiPaid}`);
        } else {
          console.log(`     ❌ Failed to update accumulatedRoi`);
        }
      }
    }
    console.log('');

    // 2. Fix Wallet Currency and Balance
    console.log(`🔧 Fixing Wallet Currency and Balance...`);
    
    const wallets = await db.collection('wallets').find({ userId: user._id }).toArray();
    
    if (wallets.length === 0) {
      console.log(`   Creating new NAIRA wallet...`);
      
      // Create a new NAIRA wallet
      const newWallet = {
        userId: user._id,
        type: 'main',
        currency: 'naira',
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const insertResult = await db.collection('wallets').insertOne(newWallet);
      if (insertResult.insertedId) {
        console.log(`     ✅ Created new NAIRA wallet: ${insertResult.insertedId}`);
        wallets.push(newWallet);
      }
    }
    
    // Update wallet currency to NAIRA and calculate correct balance
    for (const wallet of wallets) {
      // Calculate correct balance from transactions
      const transactions = await db.collection('transactions').find({
        userId: user._id,
        status: 'success'
      }).toArray();
      
      let balance = 0;
      transactions.forEach(tx => {
        if (tx.type === 'deposit' || tx.type === 'bonus' || tx.type === 'roi') {
          balance += tx.amount;
        } else if (tx.type === 'withdrawal') {
          balance -= tx.amount;
        }
      });
      
      console.log(`   Wallet ${wallet._id}:`);
      console.log(`     Current balance: ${wallet.balance} ${wallet.currency}`);
      console.log(`     Calculated balance: ${balance} NAIRA`);
      
      // Update wallet
      const updateResult = await db.collection('wallets').updateOne(
        { _id: wallet._id },
        { 
          $set: { 
            currency: 'naira',
            balance: balance,
            updatedAt: new Date()
          }
        }
      );
      
      if (updateResult.modifiedCount > 0) {
        console.log(`     ✅ Updated wallet to ${balance} NAIRA`);
      } else {
        console.log(`     ❌ Failed to update wallet`);
      }
    }
    console.log('');

    // 3. Fix ROI Countdown Issues
    console.log(`🔧 Fixing ROI Countdown Issues...`);
    
    for (const investment of investments) {
      if (investment.status === 'active') {
        const now = new Date();
        const nextRoiUpdate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
        
        console.log(`   Investment ${investment._id}:`);
        console.log(`     Setting next ROI update to: ${nextRoiUpdate}`);
        
        const updateResult = await db.collection('investments').updateOne(
          { _id: investment._id },
          { 
            $set: { 
              nextRoiUpdate: nextRoiUpdate,
              independentCountdown: nextRoiUpdate,
              roiCountdown: nextRoiUpdate,
              updatedAt: new Date()
            }
          }
        );
        
        if (updateResult.modifiedCount > 0) {
          console.log(`     ✅ Updated ROI countdown fields`);
        } else {
          console.log(`     ❌ Failed to update ROI countdown fields`);
        }
      }
    }
    console.log('');

    // 4. Verify Referral Information
    console.log(`🔧 Verifying Referral Information...`);
    
    const referrals = await db.collection('referrals').find({ referrerId: user._id }).toArray();
    
    for (const referral of referrals) {
      if (!referral.referredUserEmail) {
        // Try to get email from users collection
        const referredUser = await db.collection('users').findOne({ _id: referral.referredUserId });
        
        if (referredUser) {
          console.log(`   Referral ${referral._id}:`);
          console.log(`     Updating email from: ${referral.referredUserEmail || 'undefined'}`);
          console.log(`     To: ${referredUser.email}`);
          
          const updateResult = await db.collection('referrals').updateOne(
            { _id: referral._id },
            { 
              $set: { 
                referredUserEmail: referredUser.email,
                updatedAt: new Date()
              }
            }
          );
          
          if (updateResult.modifiedCount > 0) {
            console.log(`     ✅ Updated referral email`);
          } else {
            console.log(`     ❌ Failed to update referral email`);
          }
        }
      }
    }
    console.log('');

    // 5. Final Verification
    console.log(`🔍 Final Verification...`);
    
    // Check updated investment
    const updatedInvestment = await db.collection('investments').findOne({ userId: user._id });
    if (updatedInvestment) {
      console.log(`   Investment Status:`);
      console.log(`     Accumulated ROI: ${updatedInvestment.accumulatedRoi}`);
      console.log(`     Next ROI Update: ${updatedInvestment.nextRoiUpdate}`);
      console.log(`     Independent Countdown: ${updatedInvestment.independentCountdown}`);
    }
    
    // Check updated wallet
    const updatedWallet = await db.collection('wallets').findOne({ userId: user._id });
    if (updatedWallet) {
      console.log(`   Wallet Status:`);
      console.log(`     Balance: ${updatedWallet.balance} ${updatedWallet.currency}`);
    }
    
    // Calculate expected total balance
    const allTransactions = await db.collection('transactions').find({
      userId: user._id,
      status: 'success'
    }).toArray();
    
    let expectedBalance = 0;
    allTransactions.forEach(tx => {
      if (tx.type === 'deposit' || tx.type === 'bonus' || tx.type === 'roi') {
        expectedBalance += tx.amount;
      } else if (tx.type === 'withdrawal') {
        expectedBalance -= tx.amount;
      }
    });
    
    console.log(`   Expected Total Balance: ${expectedBalance} NAIRA`);
    console.log(`   Wallet Balance: ${updatedWallet?.balance || 0} ${updatedWallet?.currency || 'N/A'}`);
    
    if (Math.abs(expectedBalance - (updatedWallet?.balance || 0)) < 0.01) {
      console.log(`   ✅ Balance verification successful`);
    } else {
      console.log(`   ❌ Balance verification failed`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Account fixes completed');

  } catch (error) {
    console.error('❌ Error during account fixes:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the fixes
const email = 'jameszalez258@gmail.com';
fixUserAccountIssues(email);

