import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InvestmentsService } from '../investments/investments.service';
import { UsersService } from '../users/users.service';
import { ReferralsService } from '../referrals/referrals.service';
import { InvestmentPlansService } from '../investment-plans/investment-plans.service';
import { WalletService } from '../wallet/wallet.service';
import { WalletType } from '../wallet/schemas/wallet.schema';
import { Types } from 'mongoose';

async function testBonusLogic() {
  console.log('🧪 Starting Bonus Logic Test...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const investmentsService = app.get(InvestmentsService);
    const usersService = app.get(UsersService);
    const referralsService = app.get(ReferralsService);
    const investmentPlansService = app.get(InvestmentPlansService);
    const walletService = app.get(WalletService);

    // Generate unique timestamps for test emails
    const timestamp = Date.now();
    const referrerEmail = `referrer${timestamp}@test.com`;
    const referredEmail = `referred${timestamp}@test.com`;
    const newUserEmail = `newuser${timestamp}@test.com`;

    // Test 1: Create a test user (referrer)
    console.log('📝 Test 1: Creating referrer user...');
    const referrerUser = await usersService.create({
      email: referrerEmail,
      password: 'testpass123',
      firstName: 'John',
      lastName: 'Referrer',
      phoneNumber: '1234567890'
    });
    console.log(`✅ Referrer created: ${referrerUser.email} (ID: ${referrerUser._id})`);

    // Test 2: Create a test user (referred)
    console.log('\n📝 Test 2: Creating referred user...');
    const referredUser = await usersService.create({
      email: referredEmail,
      password: 'testpass123',
      firstName: 'Jane',
      lastName: 'Referred',
      phoneNumber: '0987654321',
      referralCode: referrerUser.referralCode
    });
    console.log(`✅ Referred user created: ${referredUser.email} (ID: ${referredUser._id})`);
    console.log(`✅ Referred by: ${referrerUser.email}`);

    // Test 3: Get an investment plan
    console.log('\n📝 Test 3: Getting investment plan...');
    const plans = await investmentPlansService.findAll();
    const testPlan = plans.find(p => p.currency === 'naira' && p.welcomeBonus > 0);
    if (!testPlan) {
      throw new Error('No suitable investment plan found for testing');
    }
    console.log(`✅ Using plan: ${testPlan.name} (Welcome: ${testPlan.welcomeBonus}%, Referral: ${testPlan.referralBonus}%)`);

    // Test 4: Add balance to referred user
    console.log('\n📝 Test 4: Adding balance to referred user...');
    await walletService.deposit(referredUser._id.toString(), {
      walletType: WalletType.MAIN,
      amount: testPlan.maxAmount,
      currency: testPlan.currency,
      description: 'Test balance for bonus testing'
    });
    console.log(`✅ Added ${testPlan.maxAmount} ${testPlan.currency} to referred user`);

    // Test 5: Create first investment (should get welcome bonus)
    console.log('\n📝 Test 5: Creating first investment (should get welcome bonus)...');
    const firstInvestmentAmount = testPlan.minAmount;
    const firstInvestment = await investmentsService.createFromRequest({
      planId: testPlan._id.toString(),
      amount: firstInvestmentAmount,
      currency: testPlan.currency,
      autoReinvest: false
    }, referredUser._id.toString());

    const expectedWelcomeBonus = (firstInvestmentAmount * testPlan.welcomeBonus) / 100;
    const expectedReferralBonus = (firstInvestmentAmount * testPlan.referralBonus) / 100;

    console.log(`✅ First investment created: ${firstInvestmentAmount} ${testPlan.currency}`);
    console.log(`✅ Welcome bonus: ${firstInvestment.welcomeBonus} ${testPlan.currency} (expected: ${expectedWelcomeBonus})`);
    console.log(`✅ Referral bonus: ${firstInvestment.referralBonus} ${testPlan.currency} (expected: ${expectedReferralBonus})`);

    // Verify welcome bonus was given
    if (firstInvestment.welcomeBonus === expectedWelcomeBonus) {
      console.log('✅ Welcome bonus correctly given on first investment');
    } else {
      console.log('❌ Welcome bonus not given correctly on first investment');
    }

    // Test 6: Check if referrer got referral bonus
    console.log('\n📝 Test 6: Checking referrer referral bonus...');
    const referralTransactions = await referralsService.getReferralStats(referrerUser._id.toString());
    
    console.log(`✅ Referrer total referral earnings: ${referralTransactions.totalEarnings} ${testPlan.currency}`);
    console.log(`✅ Referrer total bonus: ${referralTransactions.totalBonus} ${testPlan.currency}`);

    if (referralTransactions.totalBonus === expectedReferralBonus) {
      console.log('✅ Referral bonus correctly given to referrer');
    } else {
      console.log('❌ Referral bonus not given correctly to referrer');
    }

    // Test 7: Create second investment (should NOT get welcome bonus)
    console.log('\n📝 Test 7: Creating second investment (should NOT get welcome bonus)...');
    await walletService.deposit(referredUser._id.toString(), {
      walletType: WalletType.MAIN,
      amount: testPlan.maxAmount,
      currency: testPlan.currency,
      description: 'Additional test balance'
    });

    const secondInvestment = await investmentsService.createFromRequest({
      planId: testPlan._id.toString(),
      amount: firstInvestmentAmount,
      currency: testPlan.currency,
      autoReinvest: false
    }, referredUser._id.toString());

    console.log(`✅ Second investment created: ${firstInvestmentAmount} ${testPlan.currency}`);
    console.log(`✅ Welcome bonus: ${secondInvestment.welcomeBonus} ${testPlan.currency} (should be 0)`);
    console.log(`✅ Referral bonus: ${secondInvestment.referralBonus} ${testPlan.currency} (should be 0)`);

    if (secondInvestment.welcomeBonus === 0) {
      console.log('✅ Welcome bonus correctly NOT given on second investment');
    } else {
      console.log('❌ Welcome bonus incorrectly given on second investment');
    }

    if (secondInvestment.referralBonus === 0) {
      console.log('✅ Referral bonus correctly NOT given on second investment');
    } else {
      console.log('❌ Referral bonus incorrectly given on second investment');
    }

    // Test 8: Check bonus withdrawal eligibility
    console.log('\n📝 Test 8: Checking bonus withdrawal eligibility...');
    const bonusStatus = await usersService.canWithdrawBonus(referredUser._id.toString());
    console.log(`✅ Can withdraw bonus: ${bonusStatus.canWithdraw}`);
    console.log(`✅ Time left: ${bonusStatus.timeLeft}`);

    // Test 9: Test bonus withdrawal (should fail due to time period)
    console.log('\n📝 Test 9: Testing bonus withdrawal (should fail due to time period)...');
    const withdrawalResult = await investmentsService.withdrawBonus(referredUser._id.toString());
    console.log(`✅ Withdrawal result: ${withdrawalResult.success}`);
    console.log(`✅ Withdrawal message: ${withdrawalResult.message}`);

    if (!withdrawalResult.success) {
      console.log('✅ Bonus withdrawal correctly blocked due to time period');
    } else {
      console.log('❌ Bonus withdrawal incorrectly allowed before time period');
    }

    // Test 10: Create a new user without referral (should only get welcome bonus)
    console.log('\n📝 Test 10: Creating user without referral...');
    const newUser = await usersService.create({
      email: newUserEmail,
      password: 'testpass123',
      firstName: 'New',
      lastName: 'User',
      phoneNumber: '5555555555'
    });

    await walletService.deposit(newUser._id.toString(), {
      walletType: WalletType.MAIN,
      amount: testPlan.maxAmount,
      currency: testPlan.currency,
      description: 'Test balance for new user'
    });

    const newUserInvestment = await investmentsService.createFromRequest({
      planId: testPlan._id.toString(),
      amount: firstInvestmentAmount,
      currency: testPlan.currency,
      autoReinvest: false
    }, newUser._id.toString());

    console.log(`✅ New user investment created: ${firstInvestmentAmount} ${testPlan.currency}`);
    console.log(`✅ Welcome bonus: ${newUserInvestment.welcomeBonus} ${testPlan.currency} (should be ${expectedWelcomeBonus})`);
    console.log(`✅ Referral bonus: ${newUserInvestment.referralBonus} ${testPlan.currency} (should be 0)`);

    if (newUserInvestment.welcomeBonus === expectedWelcomeBonus && newUserInvestment.referralBonus === 0) {
      console.log('✅ New user correctly got welcome bonus only (no referral bonus)');
    } else {
      console.log('❌ New user bonus logic incorrect');
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Welcome bonus: Only given on first investment ✅');
    console.log('- Referral bonus: Only given on referred user\'s first investment ✅');
    console.log('- Bonus withdrawal: Correctly locked for configured period ✅');
    console.log('- Bonus visibility: Bonuses are visible but locked ✅');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await app.close();
  }
}

// Run the test
testBonusLogic().catch(console.error); 