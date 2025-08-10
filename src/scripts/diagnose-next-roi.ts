import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { Investment, InvestmentStatus } from '../investments/schemas/investment.schema';

async function diagnoseNextRoi() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const investmentModel = app.get<Model<any>>('InvestmentModel');

    const active = await investmentModel.find({ status: InvestmentStatus.ACTIVE }).select('userId amount currency startDate nextRoiUpdate createdAt').sort({ createdAt: -1 }).limit(50);

    console.log(`Found ${active.length} active investments to inspect`);
    const now = Date.now();

    const buckets: Record<string, number> = {};

    for (const inv of active) {
      const next = new Date(inv.nextRoiUpdate).getTime();
      const start = new Date(inv.startDate).getTime();
      const msToNext = next - now;
      const secs = Math.round((msToNext / 1000) % 3600);
      const alignKey = String(new Date(inv.nextRoiUpdate).getUTCMinutes()).padStart(2, '0') + ':' + String(new Date(inv.nextRoiUpdate).getUTCSeconds()).padStart(2, '0');
      buckets[alignKey] = (buckets[alignKey] || 0) + 1;
      console.log(`inv=${inv._id} user=${inv.userId} next=${inv.nextRoiUpdate.toISOString()} start=${new Date(start).toISOString()} secsToNext=${secs}`);
    }

    console.log('Alignment buckets (minute:second -> count):');
    Object.entries(buckets).sort().forEach(([k,v]) => console.log(`${k} -> ${v}`));

    // Heuristic: if many investments share identical second alignment, it's likely still aligned
    const maxBucket = Math.max(0, ...Object.values(buckets));
    if (maxBucket > 3) {
      console.log(`WARNING: Detected ${maxBucket} investments sharing the exact minute:second alignment. Investigate further.`);
    } else {
      console.log('OK: nextRoiUpdate values appear de-aligned and independent.');
    }
  } catch (e) {
    console.error('Diagnosis failed:', e);
  } finally {
    await app.close();
  }
}

void diagnoseNextRoi(); 