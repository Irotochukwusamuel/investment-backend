import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvestmentPlan, InvestmentPlanSchema } from './schemas/investment-plan.schema';
import { InvestmentPlansService } from './investment-plans.service';
import { InvestmentPlansController } from './investment-plans.controller';
import { SeedsModule } from '../seeds/seeds.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InvestmentPlan.name, schema: InvestmentPlanSchema },
    ]),
    SeedsModule,
  ],
  controllers: [InvestmentPlansController],
  providers: [InvestmentPlansService],
  exports: [InvestmentPlansService],
})
export class InvestmentPlansModule {} 