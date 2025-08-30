import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Investment, InvestmentSchema } from '../investments/schemas/investment.schema';
import { Transaction, TransactionSchema } from '../transactions/schemas/transaction.schema';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { WalletModule } from '../wallet/wallet.module';
import { EmailModule } from '../email/email.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    MongooseModule.forFeature([
      { name: Investment.name, schema: InvestmentSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    WalletModule,
    EmailModule,
    TransactionsModule,
    NotificationsModule,
    SettingsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {} 