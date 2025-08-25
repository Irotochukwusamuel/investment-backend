import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType, NotificationCategory } from './schemas/notification.schema';
import { EmailService } from '../email/email.service';
import { Investment, InvestmentDocument } from '../investments/schemas/investment.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class RoiNotificationsService {
  private readonly logger = new Logger(RoiNotificationsService.name);

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(Investment.name) private investmentModel: Model<InvestmentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Send comprehensive ROI notification for 24-hour cycle completion
   */
  async sendRoiCycleNotification(
    investmentId: string,
    roiAmount: number,
    cycleType: '24-hour' | 'completion' | 'manual-withdrawal'
  ): Promise<void> {
    try {
      // Get investment details with populated user and plan
      const investment = await this.investmentModel.findById(investmentId)
        .populate('userId', 'firstName lastName email')
        .populate('planId', 'name dailyRoi');

      if (!investment) {
        this.logger.error(`Investment not found for ROI notification: ${investmentId}`);
        return;
      }

      // Resolve user whether populated or just ObjectId
      const resolvedUser: UserDocument | null =
        (investment.userId && typeof (investment.userId as any) === 'object' && 'email' in (investment.userId as any))
          ? (investment.userId as unknown as UserDocument)
          : await this.userModel.findById(investment.userId).select('firstName lastName email').exec();

      const plan = investment.planId as any;

      if (!resolvedUser || !plan) {
        this.logger.error(`User or plan not found for investment: ${investmentId}`);
        return;
      }

      // Create comprehensive ROI notification
      await this.createRoiNotification(
        resolvedUser._id.toString(),
        investmentId,
        roiAmount,
        investment.currency,
        plan.name,
        cycleType,
        {
          investmentAmount: investment.amount,
          dailyRoi: plan.dailyRoi,
          totalAccumulatedRoi: investment.totalAccumulatedRoi,
          cycleNumber: this.calculateCycleNumber(investment.startDate),
          nextCycleDate: investment.nextRoiCycleDate
        }
      );

      // Send email notification
      await this.sendRoiEmailNotification(
        resolvedUser.email,
        resolvedUser.firstName,
        {
          amount: roiAmount,
          currency: investment.currency,
          investmentName: plan.name,
          paymentDate: new Date(),
          paymentType: `${cycleType === '24-hour' ? '24-Hour Cycle' : cycleType === 'completion' ? 'Investment Completion' : 'Manual Withdrawal'} ROI`,
          transactionId: `ROI-${investmentId}-${Date.now()}`,
          investmentDetails: {
            amount: investment.amount,
            dailyRoi: plan.dailyRoi,
            totalAccumulatedRoi: investment.totalAccumulatedRoi
          }
        }
      );

      this.logger.log(`✅ ROI notification sent for investment ${investmentId}: ${roiAmount} ${investment.currency}`);

    } catch (error) {
      this.logger.error(`❌ Failed to send ROI notification for investment ${investmentId}:`, error);
    }
  }

  /**
   * Create comprehensive ROI notification record
   */
  private async createRoiNotification(
    userId: string,
    investmentId: string,
    roiAmount: number,
    currency: string,
    planName: string,
    cycleType: string,
    metadata: any
  ): Promise<Notification> {
    const notification = new this.notificationModel({
      userId: new Types.ObjectId(userId),
      title: this.getRoiNotificationTitle(cycleType, roiAmount, currency),
      message: this.getRoiNotificationMessage(cycleType, roiAmount, currency, planName, metadata),
      type: NotificationType.SUCCESS,
      category: NotificationCategory.ROI,
      actionUrl: '/dashboard/investments',
      actionText: 'View Investment',
      relatedId: new Types.ObjectId(investmentId),
      relatedType: 'investment',
      metadata: {
        roiAmount,
        currency,
        planName,
        cycleType,
        timestamp: new Date(),
        ...metadata
      }
    });

    return notification.save();
  }

  /**
   * Send ROI email notification
   */
  private async sendRoiEmailNotification(
    userEmail: string,
    userName: string,
    roiData: any
  ): Promise<void> {
    try {
      await this.emailService.sendRoiPaymentNotification(
        userEmail,
        userName,
        roiData
      );
    } catch (error) {
      this.logger.error(`Failed to send ROI email notification to ${userEmail}:`, error);
    }
  }

  /**
   * Get ROI notification title based on cycle type
   */
  private getRoiNotificationTitle(cycleType: string, amount: number, currency: string): string {
    const currencySymbol = currency === 'naira' ? '₦' : '';
    
    switch (cycleType) {
      case '24-hour':
        return `ROI Payment Received - ${currencySymbol}${amount.toFixed(4)}`;
      case 'completion':
        return `Investment Completed - Final ROI: ${currencySymbol}${amount.toFixed(4)}`;
      case 'manual-withdrawal':
        return `ROI Withdrawal - ${currencySymbol}${amount.toFixed(4)}`;
      default:
        return `ROI Payment - ${currencySymbol}${amount.toFixed(4)}`;
    }
  }

  /**
   * Get ROI notification message based on cycle type
   */
  private getRoiNotificationMessage(
    cycleType: string,
    amount: number,
    currency: string,
    planName: string,
    metadata: any
  ): string {
    const currencySymbol = currency === 'naira' ? '₦' : '';
    
    switch (cycleType) {
      case '24-hour':
        return `You've received ${currencySymbol}${amount.toFixed(4)} ROI from your ${planName} investment. This represents your 24-hour cycle earnings. Your total accumulated ROI is now ${currencySymbol}${metadata.totalAccumulatedRoi.toFixed(4)}.`;
      case 'completion':
        return `Congratulations! Your ${planName} investment has completed. Final ROI payment: ${currencySymbol}${amount.toFixed(4)}. Total earnings: ${currencySymbol}${metadata.totalAccumulatedRoi.toFixed(4)}.`;
      case 'manual-withdrawal':
        return `You've manually withdrawn ${currencySymbol}${amount.toFixed(4)} ROI from your ${planName} investment. Your total accumulated ROI remains ${currencySymbol}${metadata.totalAccumulatedRoi.toFixed(4)}.`;
      default:
        return `ROI payment of ${currencySymbol}${amount.toFixed(4)} has been processed for your ${planName} investment.`;
    }
  }

  /**
   * Calculate current cycle number based on start date
   */
  private calculateCycleNumber(startDate: Date): number {
    const now = new Date();
    const timeDiff = now.getTime() - startDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    return Math.floor(daysDiff) + 1;
  }

  /**
   * Get user's ROI notification history
   */
  async getUserRoiNotificationHistory(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      investmentId?: string;
      cycleType?: string;
    } = {}
  ): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, investmentId, cycleType } = options;
    const skip = (page - 1) * limit;

    // Build query for ROI notifications
    const query: any = {
      userId: new Types.ObjectId(userId),
      category: NotificationCategory.ROI
    };

    if (investmentId) {
      query.relatedId = new Types.ObjectId(investmentId);
    }

    if (cycleType) {
      query['metadata.cycleType'] = cycleType;
    }

    // Get total count
    const total = await this.notificationModel.countDocuments(query);

    // Get notifications with pagination
    const notifications = await this.notificationModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get ROI statistics for user
   */
  async getUserRoiStats(userId: string): Promise<{
    totalRoiNotifications: number;
    totalRoiAmount: number;
    cycleTypes: { [key: string]: number };
    lastRoiPayment: Date | null;
    averageRoiPerCycle: number;
  }> {
    const roiNotifications = await this.notificationModel.find({
      userId: new Types.ObjectId(userId),
      category: NotificationCategory.ROI
    }).sort({ createdAt: -1 });

    if (roiNotifications.length === 0) {
      return {
        totalRoiNotifications: 0,
        totalRoiAmount: 0,
        cycleTypes: {},
        lastRoiPayment: null,
        averageRoiPerCycle: 0
      };
    }

    const totalRoiAmount = roiNotifications.reduce((sum, notif) => {
      return sum + (notif.metadata?.roiAmount || 0);
    }, 0);

    const cycleTypes = roiNotifications.reduce((acc, notif) => {
      const cycleType = notif.metadata?.cycleType || 'unknown';
      acc[cycleType] = (acc[cycleType] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const lastRoiPayment = roiNotifications[0]?.createdAt || null;
    const averageRoiPerCycle = totalRoiAmount / roiNotifications.length;

    return {
      totalRoiNotifications: roiNotifications.length,
      totalRoiAmount,
      cycleTypes,
      lastRoiPayment,
      averageRoiPerCycle
    };
  }

  /**
   * Mark ROI notification as read
   */
  async markRoiNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationModel.updateOne(
      {
        _id: notificationId,
        userId: new Types.ObjectId(userId),
        category: NotificationCategory.ROI
      },
      {
        $set: {
          read: true,
          readAt: new Date()
        }
      }
    );
  }

  /**
   * Mark all ROI notifications as read for a user
   */
  async markAllRoiNotificationsAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        category: NotificationCategory.ROI,
        read: false
      },
      {
        $set: {
          read: true,
          readAt: new Date()
        }
      }
    );
  }
}
