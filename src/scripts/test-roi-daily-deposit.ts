import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import { InvestmentsService } from '../investments/investments.service';
import { TasksService } from '../tasks/tasks.service';
import { Investment, InvestmentDocument, InvestmentStatus } from '../investments/schemas/investment.schema';
import { InvestmentPlan, InvestmentPlanDocument } from '../investment-plans/schemas/investment-plan.schema';
import { TransactionsService } from '../transactions/transactions.service';

function rndEmail() {
  const r = Math.random().toString(36).slice(2, 8);
  return `roi.test.${r}@example.test`;
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const users = app.get(UsersService);
    const wallets = app.get(WalletService);
    const investments = app.get(InvestmentsService);
    const tasks = app.get(TasksService);
    const txs = app.get(TransactionsService);
    const planModel = app.get<Model<InvestmentPlanDocument>>('InvestmentPlanModel');
    const invModel = app.get<Model<InvestmentDocument>>('InvestmentModel');

    // 1) Pick a NAIRA plan
    let plan = await planModel.findOne({ currency: 'naira' }).exec();
    if (!plan) plan = await planModel.findOne().exec();
    if (!plan) {
      console.error('No plan found; seed plans first.');
      return;
    }

    const amount = Math.max(plan.minAmount || 5000, 5000);

    // 2) Create user
    const user = await users.create({
      email: rndEmail(),
      password: 'Password123!',
      firstName: 'ROI',
      lastName: 'Test',
    } as any);

    // 3) Fund wallet
    await wallets.deposit(user._id.toString(), {
      walletType: 'main' as any,
      amount,
      currency: plan.currency,
      description: 'Initial funding for ROI test',
    } as any);

    // 4) Create investment
    const inv = await investments.createFromRequest({
      planId: plan._id.toString(),
      amount,
      currency: plan.currency,
      autoReinvest: false,
    } as any, user._id.toString());

    // 5) Force the 24h cycle to be due now
    const forcedDailyRoi = (amount * plan.dailyRoi) / 100;
    await invModel.findByIdAndUpdate(inv._id, {
      nextRoiCycleDate: new Date(Date.now() - 1000),
      lastRoiUpdate: new Date(Date.now() - 25 * 60 * 60 * 1000),
      earnedAmount: 0, // should not matter since exact daily payout is used
      status: InvestmentStatus.ACTIVE,
    });

    // 6) Trigger ROI update cron once
    await tasks.triggerRoiUpdate();

    // 7) Fetch updated wallet and ROI transactions
    const wallet = await wallets.findByUserAndType(user._id.toString(), 'main' as any);
    const roiTx = await txs.getTransactionModel().find({
      userId: user._id,
      investmentId: inv._id,
      type: 'roi',
      status: 'success',
    }).sort({ createdAt: -1 });

    // 8) Validate
    const last = roiTx[0];
    const passed = !!last && Math.abs(last.amount - forcedDailyRoi) < 0.01;

    console.log('--- ROI Daily Deposit Test ---');
    console.log('Plan dailyRoi %:', plan.dailyRoi);
    console.log('Expected daily amount:', forcedDailyRoi);
    console.log('Last ROI tx amount:', last?.amount);
    console.log('Wallet naira balance:', wallet.nairaBalance);
    console.log(passed ? 'RESULT: PASS ✅' : 'RESULT: FAIL ❌');
  } catch (e) {
    console.error('Test error:', e);
  } finally {
    await app.close();
  }
}

void main();


