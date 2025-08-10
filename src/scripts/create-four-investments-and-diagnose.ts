import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import { InvestmentsService } from '../investments/investments.service';
import { InvestmentPlanDocument } from '../investment-plans/schemas/investment-plan.schema';

function randomEmail(prefix: string) {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}.${rand}@example.test`;
}

async function delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const users = app.get(UsersService);
    const wallets = app.get(WalletService);
    const investments = app.get(InvestmentsService);
    const planModel = app.get<Model<InvestmentPlanDocument>>('InvestmentPlanModel');

    // Choose a NAIRA plan if available
    let plan = await planModel.findOne({ currency: 'naira' }).exec();
    if (!plan) plan = await planModel.findOne().exec();
    if (!plan) {
      console.error('No investment plan found in DB. Please seed at least one plan.');
      return;
    }

    const amount = Math.max(plan.minAmount || 5000, 5000);

    const created: Array<{ userId: string; invId: string; next: Date; }>=[];

    for (let i = 0; i < 4; i++) {
      const u = await users.create({
        email: randomEmail(`user${i+1}`),
        password: 'Password123!',
        firstName: 'User',
        lastName: `${i+1}`,
      } as any);

      await wallets.deposit(u._id.toString(), {
        walletType: 'main' as any,
        amount,
        currency: plan.currency,
        description: 'Test funding',
      } as any);

      const inv = await investments.createFromRequest({
        planId: plan._id.toString(),
        amount,
        currency: plan.currency,
        autoReinvest: false,
      } as any, u._id.toString());

      created.push({ userId: u._id.toString(), invId: inv._id.toString(), next: inv.nextRoiUpdate });

      // Stagger next user creation to ensure distinct nextRoiUpdate
      if (i < 3) await delay(1700 + i * 300);
    }

    console.log('Created 4 investments:');
    created.forEach((c, idx) => console.log(`#${idx+1}`, 'inv:', c.invId, 'user:', c.userId, 'nextRoiUpdate:', c.next.toISOString()));

    // Compare all pairwise differences
    for (let i = 0; i < created.length; i++) {
      for (let j = i+1; j < created.length; j++) {
        const diff = Math.abs(created[j].next.getTime() - created[i].next.getTime());
        console.log(`Δ(nextRoiUpdate) between #${i+1} and #${j+1}: ${diff} ms`);
      }
    }

    const allDistinct = new Set(created.map(c => c.next.getTime())).size === created.length;
    console.log(allDistinct ? 'OK: all four nextRoiUpdate values are independent.' : 'WARNING: some nextRoiUpdate values are identical.');
  } catch (e) {
    console.error('Test failed:', e);
  } finally {
    await app.close();
  }
}

void main(); 