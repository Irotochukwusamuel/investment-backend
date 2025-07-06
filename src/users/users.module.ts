import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { BankDetails, BankDetailsSchema } from './schemas/bank-details.schema';
import { Investment, InvestmentSchema } from '../investments/schemas/investment.schema';
import { EmailModule } from '../email/email.module';
import { WalletModule } from '../wallet/wallet.module';
import { ReferralsModule } from '../referrals/referrals.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: BankDetails.name, schema: BankDetailsSchema },
      { name: Investment.name, schema: InvestmentSchema },
    ]),
    EmailModule,
    WalletModule,
    forwardRef(() => ReferralsModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}