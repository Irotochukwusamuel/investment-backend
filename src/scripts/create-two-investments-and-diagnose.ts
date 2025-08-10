import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import { InvestmentsService } from '../investments/investments.service';
import { InvestmentPlan, InvestmentPlanDocument } from '../investment-plans/schemas/investment-plan.schema';

function randomEmail(prefix: string) {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}.${rand}@example.test`;
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const users = app.get(UsersService);
    const wallets = app.get(WalletService);
    const investments = app.get(InvestmentsService);
    const planModel = app.get<Model<InvestmentPlanDocument>>('InvestmentPlanModel');

    // Pick an existing NAIRA plan; fallback to any plan
    let plan = await planModel.findOne({ currency: 'naira' }).exec();
    if (!plan) plan = await planModel.findOne().exec();
    if (!plan) {
      console.error('No investment plan found in DB. Please seed at least one plan.');
      return;
    }

    const amount = Math.max(plan.minAmount || 5000, 5000);

    // Create two users
    const u1 = await users.create({
      email: randomEmail('userA'),
      password: 'Password123!',
      firstName: 'User',
      lastName: 'A',
    } as any);
    const u2 = await users.create({
      email: randomEmail('userB'),
      password: 'Password123!',
      firstName: 'User',
      lastName: 'B',
    } as any);

    // Fund wallets
    await wallets.deposit(u1._id.toString(), {
      walletType: 'main' as any,
      amount,
      currency: plan.currency,
      description: 'Test funding',
    } as any);
    await wallets.deposit(u2._id.toString(), {
      walletType: 'main' as any,
      amount,
      currency: plan.currency,
      description: 'Test funding',
    } as any);

    // Create investments
    const inv1 = await investments.createFromRequest({
      planId: plan._id.toString(),
      amount,
      currency: plan.currency,
      autoReinvest: false,
    } as any, u1._id.toString());

    // Small delay to ensure different start times
    await new Promise((r) => setTimeout(r, 1500));

    const inv2 = await investments.createFromRequest({
      planId: plan._id.toString(),
      amount,
      currency: plan.currency,
      autoReinvest: false,
    } as any, u2._id.toString());

    console.log('Created investments:');
    console.log('inv1:', inv1._id.toString(), 'user:', u1._id.toString(), 'nextRoiUpdate:', inv1.nextRoiUpdate.toISOString());
    console.log('inv2:', inv2._id.toString(), 'user:', u2._id.toString(), 'nextRoiUpdate:', inv2.nextRoiUpdate.toISOString());

    const diffMs = Math.abs(new Date(inv2.nextRoiUpdate).getTime() - new Date(inv1.nextRoiUpdate).getTime());
    console.log('Difference in nextRoiUpdate (ms):', diffMs);
    if (diffMs > 0) {
      console.log('OK: nextRoiUpdate values are independent.');
    } else {
      console.log('WARNING: nextRoiUpdate values are identical.');
    }
  } catch (e) {
    console.error('Test failed:', e);
  } finally {
    await app.close();
  }
}

void main(); 