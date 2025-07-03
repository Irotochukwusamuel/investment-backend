import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { Investment, InvestmentSchema } from '../investments/schemas/investment.schema';
import { Transaction, TransactionSchema } from '../transactions/schemas/transaction.schema';
import { TasksService } from './tasks.service';
import { WalletModule } from '../wallet/wallet.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Investment.name, schema: InvestmentSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    WalletModule,
    EmailModule,
  ],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {} 