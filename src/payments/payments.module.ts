import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { VirtualWallet, VirtualWalletSchema } from './schemas/virtual-wallet.schema';
import { WalletModule } from '../wallet/wallet.module';
import { UsersModule } from '../users/users.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VirtualWallet.name, schema: VirtualWalletSchema },
    ]),
    WalletModule,
    UsersModule,
    TransactionsModule,
    EmailModule,
    NotificationsModule,
    RealtimeModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {} 