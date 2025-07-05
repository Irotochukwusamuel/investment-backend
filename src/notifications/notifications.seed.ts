import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument, NotificationType, NotificationCategory } from './schemas/notification.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class NotificationsSeed {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seedNotifications() {
    // Get the first user for testing
    const user = await this.userModel.findOne();
    if (!user) {
      console.log('No users found, skipping notification seeding');
      return;
    }

    // Clear existing notifications for this user
    await this.notificationModel.deleteMany({ userId: user._id });

    // Create sample notifications
    const notifications = [
      {
        userId: user._id,
        title: 'Investment Successful',
        message: 'Your investment of ₦500,000 has been processed successfully.',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.INVESTMENT,
        actionUrl: '/dashboard/investments',
        actionText: 'View Investment',
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      },
      {
        userId: user._id,
        title: 'Withdrawal Pending',
        message: 'Your withdrawal request of ₦200,000 is being processed.',
        type: NotificationType.WARNING,
        category: NotificationCategory.WITHDRAWAL,
        actionUrl: '/dashboard/withdrawals',
        actionText: 'Track Withdrawal',
        createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      },
      {
        userId: user._id,
        title: 'New Investment Plan',
        message: 'Check out our new high-yield investment plan with 25% ROI.',
        type: NotificationType.INFO,
        category: NotificationCategory.SYSTEM,
        actionUrl: '/dashboard/investments',
        actionText: 'View Plans',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        userId: user._id,
        title: 'ROI Payment Received',
        message: 'You received ₦15,000 as daily ROI from your Gold Plan investment.',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.TRANSACTION,
        actionUrl: '/dashboard/wallet',
        actionText: 'View Wallet',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      },
      {
        userId: user._id,
        title: 'Security Alert',
        message: 'New login detected from Lagos, Nigeria. If this wasn\'t you, please secure your account.',
        type: NotificationType.WARNING,
        category: NotificationCategory.SECURITY,
        actionUrl: '/dashboard/settings',
        actionText: 'Review Security',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      },
      {
        userId: user._id,
        title: 'Referral Bonus',
        message: 'You earned ₦25,000 referral bonus from John Doe\'s investment.',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.BONUS,
        actionUrl: '/dashboard/wallet',
        actionText: 'View Wallet',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      },
      {
        userId: user._id,
        title: 'Deposit Confirmed',
        message: 'Your deposit of ₦100,000 has been confirmed and added to your wallet.',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.DEPOSIT,
        actionUrl: '/dashboard/wallet',
        actionText: 'View Wallet',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      },
      {
        userId: user._id,
        title: 'Investment Matured',
        message: 'Your Silver Plan investment has matured. Total return: ₦750,000.',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.INVESTMENT,
        actionUrl: '/dashboard/investments',
        actionText: 'View Investment',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
    ];

    // Insert notifications
    await this.notificationModel.insertMany(notifications);

    console.log(`Created ${notifications.length} sample notifications for user ${user.email}`);
  }
} 