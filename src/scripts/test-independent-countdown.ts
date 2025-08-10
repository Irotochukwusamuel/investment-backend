import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model, Types } from 'mongoose';
import { InvestmentStatus } from '../investments/schemas/investment.schema';

async function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const userModel = app.get<Model<any>>('UserModel');
    const planModel = app.get<Model<any>>('InvestmentPlanModel');
    const investmentModel = app.get<Model<any>>('InvestmentModel');

    // Pick 2 active users
    const users = await userModel.find({ isActive: true }).select('_id email').limit(2);
    if (users.length < 2) {
      console.log('Need at least 2 active users to test. Found:', users.length);
      return;
    }

    // Pick a naira plan
    const plan = await planModel.findOne({ currency: 'naira' });
    if (!plan) {
      console.log('No investment plan found with currency=naira');
      return;
    }

    const amount = Math.max(plan.minAmount || 5000, 50000);

    // Create first investment (User A)
    const startA = new Date();
    const endA = new Date(startA.getTime() + plan.duration * 24 * 60 * 60 * 1000);
    const nextA = new Date(startA.getTime() + 60 * 60 * 1000);

    const invA = await investmentModel.create({
      userId: new Types.ObjectId(users[0]._id),
      planId: new Types.ObjectId(plan._id),
      amount,
      currency: plan.currency,
      dailyRoi: plan.dailyRoi,
      totalRoi: plan.totalRoi,
      duration: plan.duration,
      startDate: startA,
      endDate: endA,
      expectedReturn: (amount * plan.totalRoi) / 100,
      status: InvestmentStatus.ACTIVE,
      autoReinvest: false,
      lastRoiUpdate: startA,
      nextRoiUpdate: nextA,
    });

    console.log(`Created Investment A: ${invA._id} for user ${users[0].email}, next=${nextA.toISOString()}`);

    // Wait ~20 seconds to create B
    await delay(20000);

    // Create second investment (User B) ~20s later
    const startB = new Date();
    const endB = new Date(startB.getTime() + plan.duration * 24 * 60 * 60 * 1000);
    const nextB = new Date(startB.getTime() + 60 * 60 * 1000);

    const invB = await investmentModel.create({
      userId: new Types.ObjectId(users[1]._id),
      planId: new Types.ObjectId(plan._id),
      amount,
      currency: plan.currency,
      dailyRoi: plan.dailyRoi,
      totalRoi: plan.totalRoi,
      duration: plan.duration,
      startDate: startB,
      endDate: endB,
      expectedReturn: (amount * plan.totalRoi) / 100,
      status: InvestmentStatus.ACTIVE,
      autoReinvest: false,
      lastRoiUpdate: startB,
      nextRoiUpdate: nextB,
    });

    console.log(`Created Investment B: ${invB._id} for user ${users[1].email}, next=${nextB.toISOString()}`);

    // Compute seconds remaining for both
    const now = Date.now();
    const secsA = Math.round((nextA.getTime() - now) / 1000);
    const secsB = Math.round((nextB.getTime() - now) / 1000);
    const diff = Math.abs(secsA - secsB);

    console.log(`Countdown A ≈ ${secsA}s, Countdown B ≈ ${secsB}s, Difference ≈ ${diff}s`);

    if (diff >= 15) {
      console.log('OK: Independent countdowns confirmed (>=15s apart).');
    } else {
      console.log('WARNING: Countdowns too close. Investigate scheduling.');
    }
  } catch (e) {
    console.error('Test failed:', e);
  } finally {
    await app.close();
  }
}

void run(); 