import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Investment, InvestmentSchema } from '../investments/schemas/investment.schema';
import { Transaction, TransactionSchema } from '../transactions/schemas/transaction.schema';
import { TasksService } from './tasks.service';
import { WalletModule } from '../wallet/wallet.module';
import { EmailModule } from '../email/email.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    // Conditionally enable ScheduleModule only if not in cPanel environment
    ...(process.env.NODE_ENV === 'production' && process.env.CPANEL_DISABLE_CRON !== 'true' 
      ? [ScheduleModule.forRoot()] 
      : []),
    EventEmitterModule.forRoot(),
    MongooseModule.forFeature([
      { name: Investment.name, schema: InvestmentSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    WalletModule,
    EmailModule,
    TransactionsModule,
    NotificationsModule,
  ],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {} 