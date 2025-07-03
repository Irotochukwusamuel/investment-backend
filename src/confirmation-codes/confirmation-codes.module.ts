import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfirmationCodesService } from './confirmation-codes.service';
import { ConfirmationCode, ConfirmationCodeSchema } from './schemas/confirmation-code.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConfirmationCode.name, schema: ConfirmationCodeSchema },
    ]),
  ],
  providers: [ConfirmationCodesService],
  exports: [ConfirmationCodesService],
})
export class ConfirmationCodesModule {} 