import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { RoiNotificationsService } from './roi-notifications.service';
import { NotificationsController } from './notifications.controller';
import { RoiNotificationsController } from './roi-notifications.controller';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { NotificationsSeed } from './notifications.seed';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Investment, InvestmentSchema } from '../investments/schemas/investment.schema';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
      { name: Investment.name, schema: InvestmentSchema },
    ]),
    EmailModule,
  ],
  controllers: [NotificationsController, RoiNotificationsController],
  providers: [NotificationsService, RoiNotificationsService, NotificationsSeed],
  exports: [NotificationsService, RoiNotificationsService],
})
export class NotificationsModule {} 