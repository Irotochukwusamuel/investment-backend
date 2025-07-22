import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvestmentsService } from './investments.service';
import { InvestmentsController } from './investments.controller';
import { Investment, InvestmentSchema } from './schemas/investment.schema';
import { InvestmentPlan, InvestmentPlanSchema } from '../investment-plans/schemas/investment-plan.schema';
import { Settings, SettingsSchema } from '../schemas/settings.schema';
import { WalletModule } from '../wallet/wallet.module';
import { UsersModule } from '../users/users.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReferralsModule } from '../referrals/referrals.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Investment.name, schema: InvestmentSchema },
      { name: InvestmentPlan.name, schema: InvestmentPlanSchema },
      { name: Settings.name, schema: SettingsSchema },
    ]),
    WalletModule,
    UsersModule,
    TransactionsModule,
    EmailModule,
    NotificationsModule,
    ReferralsModule,
  ],
  controllers: [InvestmentsController],
  providers: [InvestmentsService],
  exports: [InvestmentsService],
})
export class InvestmentsModule {} 