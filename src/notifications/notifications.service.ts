import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType, NotificationCategory } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  // Create a new notification
  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = new this.notificationModel(createNotificationDto);
    return notification.save();
  }

  // Create notification with simplified interface
  async createNotification(
    userId: string | Types.ObjectId,
    title: string,
    message: string,
    type: NotificationType,
    category: NotificationCategory,
    options?: {
      actionUrl?: string;
      actionText?: string;
      metadata?: Record<string, any>;
      relatedId?: Types.ObjectId;
      relatedType?: string;
    }
  ): Promise<Notification> {
    const notification = new this.notificationModel({
      userId: new Types.ObjectId(userId),
      title,
      message,
      type,
      category,
      ...options,
    });
    return notification.save();
  }

  // Get all notifications for a user
  async findAllForUser(
    userId: string | Types.ObjectId,
    options?: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      category?: NotificationCategory;
    }
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, unreadOnly = false, category } = options || {};
    const skip = (page - 1) * limit;

    const filter: any = { userId: new Types.ObjectId(userId) };
    if (unreadOnly) filter.read = false;
    if (category) filter.category = category;

    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.notificationModel.countDocuments(filter),
      this.notificationModel.countDocuments({ userId: new Types.ObjectId(userId), read: false }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get unread notifications count
  async getUnreadCount(userId: string | Types.ObjectId): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      read: false,
    });
  }

  // Mark notification as read
  async markAsRead(id: string, userId: string | Types.ObjectId): Promise<Notification> {
    const notification = await this.notificationModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { read: true, readAt: new Date(), readBy: new Types.ObjectId(userId) },
      { new: true }
    );

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string | Types.ObjectId): Promise<{ modifiedCount: number }> {
    const result = await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { read: true, readAt: new Date(), readBy: new Types.ObjectId(userId) }
    );

    return { modifiedCount: result.modifiedCount };
  }

  // Delete a notification
  async delete(id: string, userId: string | Types.ObjectId): Promise<void> {
    const result = await this.notificationModel.deleteOne({
      _id: id,
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  // Delete all notifications for a user
  async deleteAllForUser(userId: string | Types.ObjectId): Promise<{ deletedCount: number }> {
    const result = await this.notificationModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });

    return { deletedCount: result.deletedCount };
  }

  // Helper methods for common notification types
  async createInvestmentNotification(
    userId: string | Types.ObjectId,
    title: string,
    message: string,
    type: NotificationType,
    investmentId?: Types.ObjectId
  ): Promise<Notification> {
    return this.createNotification(userId, title, message, type, NotificationCategory.INVESTMENT, {
      relatedId: investmentId,
      relatedType: 'investment',
      actionUrl: investmentId ? `/dashboard/investments/${investmentId}` : '/dashboard/investments',
      actionText: 'View Investment',
    });
  }

  async createTransactionNotification(
    userId: string | Types.ObjectId,
    title: string,
    message: string,
    type: NotificationType,
    transactionId?: Types.ObjectId
  ): Promise<Notification> {
    return this.createNotification(userId, title, message, type, NotificationCategory.TRANSACTION, {
      relatedId: transactionId,
      relatedType: 'transaction',
      actionUrl: transactionId ? `/dashboard/transactions/${transactionId}` : '/dashboard/wallet',
      actionText: 'View Transaction',
    });
  }

  async createWithdrawalNotification(
    userId: string | Types.ObjectId,
    title: string,
    message: string,
    type: NotificationType,
    withdrawalId?: Types.ObjectId
  ): Promise<Notification> {
    return this.createNotification(userId, title, message, type, NotificationCategory.WITHDRAWAL, {
      relatedId: withdrawalId,
      relatedType: 'withdrawal',
      actionUrl: '/dashboard/withdrawals',
      actionText: 'View Withdrawals',
    });
  }

  async createBonusNotification(
    userId: string | Types.ObjectId,
    title: string,
    message: string,
    type: NotificationType = NotificationType.SUCCESS
  ): Promise<Notification> {
    return this.createNotification(userId, title, message, type, NotificationCategory.BONUS, {
      actionUrl: '/dashboard/wallet',
      actionText: 'View Wallet',
    });
  }

  async createSecurityNotification(
    userId: string | Types.ObjectId,
    title: string,
    message: string,
    type: NotificationType = NotificationType.WARNING
  ): Promise<Notification> {
    return this.createNotification(userId, title, message, type, NotificationCategory.SECURITY, {
      actionUrl: '/dashboard/settings',
      actionText: 'Review Security',
    });
  }
} 