import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Investment, InvestmentSchema } from '../investments/schemas/investment.schema';
import { Withdrawal, WithdrawalSchema } from '../withdrawals/schemas/withdrawal.schema';
import { Wallet, WalletSchema } from '../wallet/schemas/wallet.schema';
import { InvestmentPlan, InvestmentPlanSchema } from '../investment-plans/schemas/investment-plan.schema';
import { Notice, NoticeSchema } from '../schemas/notice.schema';
import { Settings, SettingsSchema } from '../schemas/settings.schema';
import { UsersModule } from '../users/users.module';
import { InvestmentsModule } from '../investments/investments.module';
import { WithdrawalsModule } from '../withdrawals/withdrawals.module';
import { WalletModule } from '../wallet/wallet.module';
import { InvestmentPlansModule } from '../investment-plans/investment-plans.module';
import { NoticeModule } from '../notice/notice.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { SettingsController } from './settings.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Investment.name, schema: InvestmentSchema },
      { name: Withdrawal.name, schema: WithdrawalSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: InvestmentPlan.name, schema: InvestmentPlanSchema },
      { name: Notice.name, schema: NoticeSchema },
      { name: Settings.name, schema: SettingsSchema },
    ]),
    UsersModule,
    InvestmentsModule,
    forwardRef(() => WithdrawalsModule),
    WalletModule,
    InvestmentPlansModule,
    NoticeModule,
    EmailModule,
    NotificationsModule,
    TransactionsModule,
  ],
  controllers: [AdminController, SettingsController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {} 