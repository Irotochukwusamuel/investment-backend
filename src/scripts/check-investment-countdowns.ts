import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { InvestmentDocument, InvestmentStatus } from '../investments/schemas/investment.schema';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const investmentModel = app.get<Model<InvestmentDocument>>('InvestmentModel');

    const list = await investmentModel
      .find({ status: InvestmentStatus.ACTIVE })
      .select('userId nextRoiUpdate startDate createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    const now = Date.now();
    console.log(`Inspecting ${list.length} most recent active investments...`);
    const secondsList: number[] = [];
    list.forEach((inv, idx) => {
      const remainingMs = new Date(inv.nextRoiUpdate).getTime() - now;
      const secs = Math.max(0, Math.floor(remainingMs / 1000));
      secondsList.push(secs);
      console.log(`#${idx+1} inv=${inv._id} user=${inv.userId} next=${inv.nextRoiUpdate.toISOString()} secsRemaining=${secs}`);
    });

    const unique = new Set(secondsList).size;
    console.log(`Unique countdown values (seconds): ${unique}/${secondsList.length}`);
    if (unique === secondsList.length) {
      console.log('OK: All countdowns are independent at this instant.');
    } else {
      console.log('Note: Some countdowns share the same seconds value (can happen by chance), check nextRoiUpdate stamps for independence.');
    }
  } catch (e) {
    console.error('Countdown check failed:', e);
  } finally {
    await app.close();
  }
}

void main(); 