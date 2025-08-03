import { Injectable, NotFoundException, BadRequestException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Investment, InvestmentDocument, InvestmentStatus } from './schemas/investment.schema';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { CreateInvestmentRequestDto } from './dto/create-investment-request.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { InvestmentPlan, InvestmentPlanDocument } from '../investment-plans/schemas/investment-plan.schema';
import { WalletService } from '../wallet/wallet.service';
import { WalletType } from '../wallet/schemas/wallet.schema';
import { UsersService } from '../users/users.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType, TransactionStatus } from '../transactions/schemas/transaction.schema';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { ReferralsService } from '../referrals/referrals.service';
import { Referral } from '../referrals/schemas/referral.schema';
import { Settings, SettingsDocument } from '../schemas/settings.schema';

@Injectable()
export class InvestmentsService {
  constructor(
    @InjectModel(Investment.name) private investmentModel: Model<InvestmentDocument>,
    @InjectModel(InvestmentPlan.name) private investmentPlanModel: Model<InvestmentPlanDocument>,
    @InjectModel(Settings.name) private settingsModel: Model<SettingsDocument>,
    private readonly walletService: WalletService,
    private readonly usersService: UsersService,
    private readonly transactionsService: TransactionsService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => ReferralsService))
    private readonly referralsService: ReferralsService,
  ) {}

  async createFromRequest(createInvestmentRequestDto: CreateInvestmentRequestDto, userId: string): Promise<Investment> {
    // Fetch the investment plan to get the required data
    const plan = await this.investmentPlanModel.findById(createInvestmentRequestDto.planId);
    if (!plan) {
      throw new NotFoundException('Investment plan not found');
    }

    // Check USDT investment settings
    if (plan.currency === 'usdt') {
      const platformSettings = await this.settingsModel.findOne({ key: 'platform' });
      const usdtInvestmentEnabled = platformSettings?.value?.usdtInvestmentEnabled ?? false;
      if (!usdtInvestmentEnabled) {
        throw new BadRequestException('USDT investments are currently disabled. Please try again later.');
      }
    }

    // Check if user already has 3 active investments (maximum limit)
    const activeInvestments = await this.investmentModel.countDocuments({
      userId: new Types.ObjectId(userId),
      status: InvestmentStatus.ACTIVE
    });

    if (activeInvestments >= 3) {
      throw new BadRequestException('You can only have a maximum of 3 active investment plans at a time');
    }

    // Validate amount is within plan limits
    if (createInvestmentRequestDto.amount < plan.minAmount || createInvestmentRequestDto.amount > plan.maxAmount) {
      throw new BadRequestException(`Investment amount must be between ${plan.minAmount} and ${plan.maxAmount}`);
    }

    // Validate currency matches plan currency
    if (createInvestmentRequestDto.currency !== plan.currency) {
      throw new BadRequestException(`Investment currency must be ${plan.currency}`);
    }

    // Check if user has sufficient balance
    const hasBalance = await this.walletService.checkBalance(
      userId, 
      createInvestmentRequestDto.amount, 
      createInvestmentRequestDto.currency
    );

    if (!hasBalance) {
      const currentBalance = await this.walletService.getBalance(
        userId, 
        createInvestmentRequestDto.currency
      );
      throw new BadRequestException(
        `Insufficient balance. Current balance: ${currentBalance} ${createInvestmentRequestDto.currency.toUpperCase()}, Required: ${createInvestmentRequestDto.amount} ${createInvestmentRequestDto.currency.toUpperCase()}`
      );
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.duration);

    // Calculate expected return
    const expectedReturn = (createInvestmentRequestDto.amount * plan.totalRoi) / 100;

    // Set next ROI update to next hour
    const nextRoiUpdate = new Date();
    nextRoiUpdate.setHours(nextRoiUpdate.getHours() + 1);
    nextRoiUpdate.setMinutes(0, 0, 0); // Set to the top of the hour

    // Get user data for notifications and emails
    const user = await this.usersService.findById(userId);

    // Check if this is the user's first investment (for welcome bonus)
    const isFirstInvestment = await this.isUserFirstInvestment(userId);
    
    // Check if this is the referred user's first investment (for referral bonus)
    const isReferredUserFirstInvestment = user.referredBy ? await this.isReferredUserFirstInvestment(userId) : false;

    // Calculate bonuses - only on first investment
    const welcomeBonus = isFirstInvestment ? (createInvestmentRequestDto.amount * plan.welcomeBonus) / 100 : 0;
    const referralBonus = isReferredUserFirstInvestment ? (createInvestmentRequestDto.amount * plan.referralBonus) / 100 : 0;

    // Create the full investment DTO
    const createInvestmentDto: CreateInvestmentDto = {
      planId: createInvestmentRequestDto.planId,
      amount: createInvestmentRequestDto.amount,
      currency: createInvestmentRequestDto.currency,
      dailyRoi: plan.dailyRoi,
      totalRoi: plan.totalRoi,
      duration: plan.duration,
      startDate,
      endDate,
      expectedReturn,
      nextRoiUpdate,
      autoReinvest: createInvestmentRequestDto.autoReinvest || false,
      welcomeBonus,
      referralBonus,
    };

    // Create the investment
    const investment = await this.create(createInvestmentDto, userId);

    // Return the populated investment with plan data
    const populatedInvestment = await this.findOne(investment._id.toString());

    // Set first active investment date for bonus withdrawal tracking
    await this.usersService.setFirstActiveInvestmentDate(userId);

    // Deduct the amount from user's main wallet
    await this.walletService.withdraw(userId, {
      walletType: WalletType.MAIN,
      amount: createInvestmentRequestDto.amount,
      currency: createInvestmentRequestDto.currency,
      description: `Investment in ${plan.name}`,
    });

    // Credit welcome bonus to user's wallet (but it will be locked until withdrawal period)
    if (welcomeBonus > 0) {
      console.log(`🎁 Crediting welcome bonus: ${welcomeBonus} ${createInvestmentRequestDto.currency} to user ${userId} (first investment)`);
      
      // Mark user as having received welcome bonus
      await this.usersService.markWelcomeBonusGiven(userId);
      
      // Add welcome bonus to user's locked bonus balance (not available for withdrawal yet)
      await this.walletService.depositBonus(userId, {
        walletType: WalletType.MAIN,
        amount: welcomeBonus,
        currency: createInvestmentRequestDto.currency,
        description: `Welcome bonus from ${plan.name} investment (first investment)`,
      });

      // Create transaction record for welcome bonus
      await this.transactionsService.create({
        userId,
        type: TransactionType.BONUS,
        amount: welcomeBonus,
        currency: createInvestmentRequestDto.currency,
        description: `Welcome bonus from ${plan.name} investment (first investment)`,
        status: TransactionStatus.SUCCESS,
        investmentId: populatedInvestment._id.toString(),
      });

      // Create notification for welcome bonus
      await this.notificationsService.createBonusNotification(
        userId,
        'Welcome Bonus Earned',
        `You earned ${createInvestmentRequestDto.currency === 'naira' ? '₦' : '$'}${welcomeBonus.toLocaleString()} welcome bonus from your first ${plan.name} investment.`,
        NotificationType.SUCCESS
      );

      // Send welcome bonus email
      try {
        await this.emailService.sendWelcomeBonusEmail(
          user.email,
          user.firstName || user.email,
          {
            bonusAmount: welcomeBonus,
            currency: createInvestmentRequestDto.currency,
            availableDate: new Date(Date.now() + (15 * 24 * 60 * 60 * 1000)), // 15 days from now
            userId: userId,
          }
        );
      } catch (error) {
        console.error('Failed to send welcome bonus email:', error);
      }
    }

    // Process referral bonus if user was referred by someone and this is their first investment
    if (user.referredBy && referralBonus > 0 && isReferredUserFirstInvestment) {
      console.log(`🎁 Processing referral bonus: ${referralBonus} ${createInvestmentRequestDto.currency} for referrer ${user.referredBy} (referred user's first investment)`);
      
      // Add referral bonus to referrer's locked bonus balance (not available for withdrawal yet)
      await this.walletService.depositBonus(user.referredBy.toString(), {
        walletType: WalletType.MAIN,
        amount: referralBonus,
        currency: createInvestmentRequestDto.currency,
        description: `Referral bonus from ${user.firstName} ${user.lastName}'s first investment`,
      });

      // Update referrer's referral earnings
      await this.usersService.updateReferralStats(user.referredBy.toString(), referralBonus);

      // Update referral record to mark as active and add bonus
      let referral: Referral | null = null;
      try {
        referral = await this.referralsService.findByReferredUser(userId);
        if (referral) {
          await this.referralsService.update(referral._id.toString(), {
            isActive: true,
            status: 'active',
            referralBonus: referralBonus,
            totalEarnings: referralBonus,
            firstInvestmentAt: new Date(),
            lastActivityAt: new Date()
          });
          console.log(`✅ Updated referral record for user ${userId}`);
        }
      } catch (error) {
        console.error('Failed to update referral record:', error);
      }

      // Create transaction record for referral bonus
      await this.transactionsService.create({
        userId: user.referredBy.toString(),
        type: TransactionType.REFERRAL,
        amount: referralBonus,
        currency: createInvestmentRequestDto.currency,
        description: `Referral bonus from ${user.firstName} ${user.lastName}'s first investment`,
        status: TransactionStatus.SUCCESS,
        investmentId: populatedInvestment._id.toString(),
      });

      // Create notification for referral bonus
      await this.notificationsService.createBonusNotification(
        user.referredBy.toString(),
        'Referral Bonus Earned',
        `You earned ${createInvestmentRequestDto.currency === 'naira' ? '₦' : '$'}${referralBonus.toLocaleString()} referral bonus from ${user.firstName} ${user.lastName}'s first investment.`,
        NotificationType.SUCCESS
      );

      // Send referral bonus email
      try {
        const referrer = await this.usersService.findById(user.referredBy.toString());
        await this.emailService.sendReferralBonusEmail(
          referrer.email,
          referrer.firstName || referrer.email,
          {
            bonusAmount: referralBonus,
            currency: createInvestmentRequestDto.currency,
            referredUserName: `${user.firstName} ${user.lastName}`,
            referredInvestmentAmount: createInvestmentRequestDto.amount,
            bonusPercentage: plan.referralBonus,
            dateEarned: new Date(),
            referralId: referral?._id.toString() || 'unknown'
          }
        );
      } catch (error) {
        console.error('Failed to send referral bonus email:', error);
      }
    } else {
      console.log(`ℹ️ No referral bonus: user ${userId} has no referrer, referral bonus is 0, or not their first investment`);
    }

    // Create notification for successful investment
    await this.notificationsService.createInvestmentNotification(
      userId,
      'Investment Created Successfully',
      `Your investment of ₦${createInvestmentRequestDto.amount.toLocaleString()} in ${plan.name} has been created successfully.`,
      NotificationType.SUCCESS,
      populatedInvestment._id
    );

    // Send investment confirmation email
    try {
      await this.emailService.sendInvestmentConfirmation(
        user.email,
        user.firstName || user.email,
        {
          planName: plan.name,
          amount: createInvestmentRequestDto.amount,
          currency: createInvestmentRequestDto.currency,
          dailyRoi: plan.dailyRoi,
          duration: plan.duration,
          startDate: startDate,
          expectedTotalRoi: expectedReturn,
          investmentId: populatedInvestment._id.toString(),
        }
      );
    } catch (error) {
      // Log error but don't fail investment creation
      console.error('Failed to send investment confirmation email:', error);
    }

    return populatedInvestment;
  }

  async create(createInvestmentDto: CreateInvestmentDto, userId: string): Promise<Investment> {
    const investment = new this.investmentModel({
      ...createInvestmentDto,
      userId: new Types.ObjectId(userId),
      planId: new Types.ObjectId(createInvestmentDto.planId),
      transactionId: createInvestmentDto.transactionId ? new Types.ObjectId(createInvestmentDto.transactionId) : undefined,
    });

    return investment.save();
  }

  async findAll(query: any = {}): Promise<Investment[]> {
    const { userId, status, currency, limit = 50, page = 1 } = query;
    
    const filter: any = {};
    
    if (userId) {
      filter.userId = new Types.ObjectId(userId);
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (currency) {
      filter.currency = currency;
    }

    const skip = (page - 1) * limit;
    
    return this.investmentModel
      .find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('planId', 'name description dailyRoi totalRoi')
      .populate('transactionId', 'amount currency type status')
      .populate('payoutHistory', 'amount currency type status createdAt description reference')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async findOne(id: string): Promise<Investment> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid investment ID');
    }

    const investment = await this.investmentModel
      .findById(id)
      .populate('userId', 'firstName lastName email')
      .populate('planId', 'name description dailyRoi totalRoi')
      .populate('transactionId', 'amount currency type status')
      .populate('payoutHistory', 'amount currency type status createdAt description reference')
      .exec();

    if (!investment) {
      throw new NotFoundException('Investment not found');
    }

    return investment;
  }

  async findByUserId(userId: string, query: any = {}): Promise<Investment[]> {
    const { status, currency, limit = 50, page = 1 } = query;
    
    const filter: any = { userId: new Types.ObjectId(userId) };
    
    if (status) {
      filter.status = status;
    }
    
    if (currency) {
      filter.currency = currency;
    }

    const skip = (page - 1) * limit;
    
    return this.investmentModel
      .find(filter)
      .populate('planId', 'name description dailyRoi totalRoi')
      .populate('transactionId', 'amount currency type status')
      .populate('payoutHistory', 'amount currency type status createdAt description reference')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async update(id: string, updateInvestmentDto: UpdateInvestmentDto): Promise<Investment> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid investment ID');
    }

    const investment = await this.investmentModel
      .findByIdAndUpdate(
        id,
        {
          ...updateInvestmentDto,
          planId: updateInvestmentDto.planId ? new Types.ObjectId(updateInvestmentDto.planId) : undefined,
          transactionId: updateInvestmentDto.transactionId ? new Types.ObjectId(updateInvestmentDto.transactionId) : undefined,
        },
        { new: true, runValidators: true }
      )
      .populate('userId', 'firstName lastName email')
      .populate('planId', 'name description dailyRoi totalRoi')
      .populate('transactionId', 'amount currency type status')
      .exec();

    if (!investment) {
      throw new NotFoundException('Investment not found');
    }

    return investment;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid investment ID');
    }

    const investment = await this.investmentModel.findByIdAndDelete(id).exec();
    
    if (!investment) {
      throw new NotFoundException('Investment not found');
    }
  }

  async updateRoi(id: string, earnedAmount: number): Promise<Investment> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid investment ID');
    }

    const investment = await this.investmentModel
      .findByIdAndUpdate(
        id,
        {
          $inc: { earnedAmount },
          lastRoiUpdate: new Date(),
          nextRoiUpdate: new Date(Date.now() + 60 * 60 * 1000), // Next hour
        },
        { new: true, runValidators: true }
      )
      .exec();

    if (!investment) {
      throw new NotFoundException('Investment not found');
    }

    return investment;
  }

  async completeInvestment(id: string): Promise<Investment> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid investment ID');
    }

    const investment = await this.investmentModel
      .findByIdAndUpdate(
        id,
        {
          status: InvestmentStatus.COMPLETED,
          endDate: new Date(),
        },
        { new: true, runValidators: true }
      )
      .exec();

    if (!investment) {
      throw new NotFoundException('Investment not found');
    }

    return investment;
  }

  async cancelInvestment(id: string, reason?: string): Promise<Investment> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid investment ID');
    }

    const existingInvestment = await this.investmentModel.findById(id).exec();
    if (!existingInvestment) {
      throw new NotFoundException('Investment not found');
    }

    const updatedNotes = reason 
      ? `${existingInvestment.notes || ''}\nCancelled: ${reason}`.trim() 
      : existingInvestment.notes;

    const investment = await this.investmentModel
      .findByIdAndUpdate(
        id,
        {
          status: InvestmentStatus.CANCELLED,
          notes: updatedNotes,
        },
        { new: true, runValidators: true }
      )
      .exec();

    if (!investment) {
      throw new NotFoundException('Investment not found');
    }

    return investment;
  }

  async getInvestmentsForRoiUpdate(): Promise<Investment[]> {
    const now = new Date();
    
    return this.investmentModel
      .find({
        status: InvestmentStatus.ACTIVE,
        nextRoiUpdate: { $lte: now },
      })
      .populate('planId', 'dailyRoi')
      .exec();
  }

  async getInvestmentStats(userId?: string): Promise<any> {
    const filter: any = {};
    
    if (userId) {
      filter.userId = new Types.ObjectId(userId);
    }

    const stats = await this.investmentModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalInvestments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalEarnings: { $sum: '$earnedAmount' },
          totalExpectedReturn: { $sum: '$expectedReturn' },
          averageRoi: { $avg: '$dailyRoi' },
          activeInvestments: {
            $sum: { $cond: [{ $eq: ['$status', InvestmentStatus.ACTIVE] }, 1, 0] }
          },
          completedInvestments: {
            $sum: { $cond: [{ $eq: ['$status', InvestmentStatus.COMPLETED] }, 1, 0] }
          },
          cancelledInvestments: {
            $sum: { $cond: [{ $eq: ['$status', InvestmentStatus.CANCELLED] }, 1, 0] }
          },
        }
      }
    ]);

    // Calculate totalPayouts and pendingPayouts from transaction history
    const payoutStats = await this.transactionsService.getTransactionModel().aggregate([
      { 
        $match: { 
          ...filter,
          type: 'roi',
          status: { $in: ['completed', 'pending'] }
        } 
      },
      {
        $group: {
          _id: null,
          totalPayouts: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                '$amount',
                0
              ]
            }
          },
          pendingPayouts: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'pending'] },
                '$amount',
                0
              ]
            }
          }
        }
      }
    ]);

    // Get recent investments
    const recentInvestments = await this.investmentModel
      .find(filter)
      .populate('planId')
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();

    // Calculate completion rate
    const totalCompleted = stats[0]?.completedInvestments || 0;
    const totalInvestments = stats[0]?.totalInvestments || 0;
    const completionRate = totalInvestments > 0 ? (totalCompleted / totalInvestments) * 100 : 0;

    // Get top performing plan (plan with highest total earnings)
    const topPerformingPlan = await this.investmentModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$planId',
          totalEarnings: { $sum: '$earnedAmount' },
          totalInvestments: { $sum: 1 }
        }
      },
      { $sort: { totalEarnings: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: 'investmentplans',
          localField: '_id',
          foreignField: '_id',
          as: 'plan'
        }
      },
      { $unwind: '$plan' }
    ]);

    return {
      ...stats[0],
      totalEarnings: stats[0]?.totalEarnings || 0,
      totalAmount: stats[0]?.totalAmount || 0,
      activeInvestments: stats[0]?.activeInvestments || 0,
      averageRoi: stats[0]?.averageRoi || 0,
      totalPayouts: payoutStats[0]?.totalPayouts || 0,
      pendingPayouts: payoutStats[0]?.pendingPayouts || 0,
      completionRate,
      topPerformingPlan: topPerformingPlan[0]?.plan || null,
      recentInvestments,
      totalInvestments: stats[0]?.totalInvestments || 0,
      totalExpectedReturn: stats[0]?.totalExpectedReturn || 0,
      completedInvestments: stats[0]?.completedInvestments || 0,
      cancelledInvestments: stats[0]?.cancelledInvestments || 0,
    };
  }

  async getInvestmentsByCurrency(currency: string): Promise<Investment[]> {
    return this.investmentModel
      .find({ currency })
      .populate('userId', 'firstName lastName email')
      .populate('planId', 'name description')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getActiveInvestments(): Promise<Investment[]> {
    return this.investmentModel.find({ status: InvestmentStatus.ACTIVE }).exec();
  }

  async findActiveInvestmentsByUser(userId: string): Promise<Investment[]> {
    return this.investmentModel.find({
      userId: new Types.ObjectId(userId),
      status: InvestmentStatus.ACTIVE
    }).exec();
  }

  // Handle bonus withdrawal with configurable period rule
  async withdrawBonus(userId: string): Promise<{ success: boolean; message: string; amount?: number }> {
    // Check if user can withdraw bonus
    const bonusStatus = await this.usersService.canWithdrawBonus(userId);
    
    if (!bonusStatus.canWithdraw) {
      // Get bonus withdrawal period from settings for the error message
      let BONUS_WAIT_VALUE = 15;
      let BONUS_WAIT_UNIT = 'minutes';
      
      try {
        const settings = await this.settingsModel.findOne({ key: 'platform' });
        if (settings?.value?.bonusWithdrawalPeriod) {
          BONUS_WAIT_VALUE = settings.value.bonusWithdrawalPeriod;
          BONUS_WAIT_UNIT = settings.value.bonusWithdrawalUnit || 'minutes';
        }
      } catch (error) {
        console.error('Error fetching bonus withdrawal period from settings:', error);
        // Fallback to default 15 minutes
      }
      
      return {
        success: false,
        message: `Bonus can only be withdrawn after ${BONUS_WAIT_VALUE} ${BONUS_WAIT_UNIT} of active investment. You have ${bonusStatus.timeLeft || bonusStatus.daysLeft + ' ' + BONUS_WAIT_UNIT} remaining.`
      };
    }

    // Get user's wallet to check locked bonuses
    const wallet = await this.walletService.findByUserAndType(userId, WalletType.MAIN);
    const currency = 'naira'; // Default to naira, can be made dynamic later
    
    // Calculate total locked bonus
    const totalLockedBonus = currency === 'naira' ? wallet.lockedNairaBonuses : wallet.lockedUsdtBonuses;

    if (totalLockedBonus <= 0) {
      return {
        success: false,
        message: 'No bonuses available for withdrawal.'
      };
    }

    // Unlock the bonus (move from locked to available balance)
    await this.walletService.unlockBonus(userId, totalLockedBonus, currency);

    // Record the bonus withdrawal
    await this.usersService.recordBonusWithdrawal(userId);

    // Create transaction record
    await this.transactionsService.create({
      userId,
      type: TransactionType.BONUS,
      amount: totalLockedBonus,
      currency,
      description: 'Bonus withdrawal (Welcome + Referral bonuses)',
      status: TransactionStatus.SUCCESS,
    });

    return {
      success: true,
      message: `Successfully withdrawn ${totalLockedBonus} ${currency.toUpperCase()} in bonuses.`,
      amount: totalLockedBonus
    };
  }

  // Handle daily ROI withdrawal
  async withdrawDailyRoi(userId: string): Promise<{ success: boolean; message: string; amount?: number }> {
    // Get user's active investments
    const activeInvestments = await this.findActiveInvestmentsByUser(userId);
    
    if (activeInvestments.length === 0) {
      return {
        success: false,
        message: 'No active investments found. You need active investments to withdraw daily ROI.'
      };
    }

    // Calculate total earned ROI from all active investments
    let totalEarnedRoi = 0;
    let currency: 'naira' | 'usdt' = 'naira'; // Default currency

    for (const investment of activeInvestments) {
      // Use the earnedAmount field instead of recalculating
      totalEarnedRoi += investment.earnedAmount || 0;
      currency = investment.currency; // Use the currency of the first investment
    }

    if (totalEarnedRoi <= 0) {
      return {
        success: false,
        message: 'No daily ROI available to withdraw. ROI accumulates over time and will be available for withdrawal.'
      };
    }

    // Get user's wallet
    const wallet = await this.walletService.findByUserAndType(userId, WalletType.MAIN);
    if (!wallet) {
      return {
        success: false,
        message: 'Wallet not found.'
      };
    }

    // Add earned ROI to available balance
    if (currency === 'naira') {
      wallet.nairaBalance += totalEarnedRoi;
    } else {
      wallet.usdtBalance += totalEarnedRoi;
    }
    await wallet.save();

    // Reset earnedAmount to 0 for all active investments after withdrawal
    for (const investment of activeInvestments) {
      if (investment.earnedAmount > 0) {
        await this.investmentModel.findByIdAndUpdate(
          investment._id,
          { 
            $set: { 
              earnedAmount: 0,
              lastRoiUpdate: new Date()
            }
          }
        );
      }
    }

    // Create transaction record
    await this.transactionsService.create({
      userId,
      type: TransactionType.ROI,
      amount: totalEarnedRoi,
      currency,
      description: 'Daily ROI withdrawal',
      status: TransactionStatus.SUCCESS,
    });

    return {
      success: true,
      message: `Successfully withdrawn ${totalEarnedRoi.toFixed(2)} ${currency.toUpperCase()} in daily ROI.`,
      amount: totalEarnedRoi
    };
  }

  // Helper method to check if this is the user's first investment
  private async isUserFirstInvestment(userId: string): Promise<boolean> {
    // First check if welcome bonus has already been given
    const user = await this.usersService.findById(userId);
    if (user.welcomeBonusGiven) {
      return false;
    }

    // Then check if user has any existing investments
    const existingInvestments = await this.investmentModel.countDocuments({
      userId: new Types.ObjectId(userId),
      status: { $in: [InvestmentStatus.ACTIVE, InvestmentStatus.COMPLETED, InvestmentStatus.CANCELLED] }
    });
    
    return existingInvestments === 0;
  }

  // Helper method to check if this is the referred user's first investment
  private async isReferredUserFirstInvestment(userId: string): Promise<boolean> {
    const existingInvestments = await this.investmentModel.countDocuments({
      userId: new Types.ObjectId(userId),
      status: { $in: [InvestmentStatus.ACTIVE, InvestmentStatus.COMPLETED, InvestmentStatus.CANCELLED] }
    });
    
    return existingInvestments === 0;
  }
} 