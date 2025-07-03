import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { InvestmentPlansModule } from './investment-plans/investment-plans.module';
import { InvestmentsModule } from './investments/investments.module';
import { TransactionsModule } from './transactions/transactions.module';
import { WalletModule } from './wallet/wallet.module';
import { EmailModule } from './email/email.module';
import { TasksModule } from './tasks/tasks.module';
import { SeedsModule } from './seeds/seeds.module';
import { ConfirmationCodesModule } from './confirmation-codes/confirmation-codes.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/kltmines',
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Feature modules
    UsersModule,
    AuthModule,
    InvestmentPlansModule,
    InvestmentsModule,
    TransactionsModule,
    WalletModule,
    EmailModule,
    TasksModule,
    SeedsModule,
    ConfirmationCodesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
