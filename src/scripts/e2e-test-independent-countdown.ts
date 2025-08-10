import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { Investment } from '../investments/schemas/investment.schema';
import { InvestmentPlan } from '../investment-plans/schemas/investment-plan.schema';
import { InvestmentsService } from '../investments/investments.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const userModel = app.get<Model<any>>('UserModel');
    const planModel = app.get<Model<InvestmentPlan>>('InvestmentPlanModel');
    const investmentModel = app.get<Model<Investment>>('InvestmentModel');
    const investmentsService = app.get(InvestmentsService);

    const users = await userModel.find({ isActive: true }).select('_id email').limit(2);
    if (users.length < 2) {
      console.log('Need at least 2 users in DB to run this test.');
      return;
    }
    const [u1, u2] = users;

    const plan = await planModel.findOne({ currency: 'naira' }).select('_id name currency minAmount maxAmount');
    if (!plan) {
      console.log('No naira investment plan found.');
      return;
    }

    const amount = Math.max(plan['minAmount'] || 5000, 5000);

    console.log('Creating investment for User A:', u1.email);
    const a = await investmentsService.createFromRequest({
      planId: plan._id.toString(),
      amount,
      currency: 'naira',
      autoReinvest: false,
    } as any, u1._id.toString());

    // wait ~5 seconds to ensure different schedule
    await new Promise((r) => setTimeout(r, 5000));

    console.log('Creating investment for User B:', u2.email);
    const b = await investmentsService.createFromRequest({
      planId: plan._id.toString(),
      amount,
      currency: 'naira',
      autoReinvest: false,
    } as any, u2._id.toString());

    const invA = await investmentModel.findById(a._id).select('nextRoiUpdate startDate userId');
    const invB = await investmentModel.findById(b._id).select('nextRoiUpdate startDate userId');

    if (!invA || !invB) {
      console.log('Could not reload created investments.');
      return;
    }

    const nextA = new Date(invA.nextRoiUpdate).getTime();
    const nextB = new Date(invB.nextRoiUpdate).getTime();
    const diffSec = Math.abs(nextA - nextB) / 1000;

    console.log('User A nextRoiUpdate:', new Date(nextA).toISOString());
    console.log('User B nextRoiUpdate:', new Date(nextB).toISOString());
    console.log('Difference (seconds):', diffSec.toFixed(2));

    if (diffSec >= 3) {
      console.log('PASS: Independent countdowns confirmed (>= 3s apart).');
    } else {
      console.log('FAIL: nextRoiUpdate values are too close; independence not confirmed.');
    }
  } catch (e) {
    console.error('Test failed with error:', e);
  } finally {
    await app.close();
  }
}

void run(); 