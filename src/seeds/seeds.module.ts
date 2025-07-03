import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvestmentPlan, InvestmentPlanSchema } from '../investment-plans/schemas/investment-plan.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { SeedsService } from './seeds.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InvestmentPlan.name, schema: InvestmentPlanSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [SeedsService],
  exports: [SeedsService],
})
export class SeedsModule {} 