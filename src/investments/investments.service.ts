import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
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

@Injectable()
export class InvestmentsService {
  constructor(
    @InjectModel(Investment.name) private investmentModel: Model<InvestmentDocument>,
    @InjectModel(InvestmentPlan.name) private investmentPlanModel: Model<InvestmentPlanDocument>,
    private readonly walletService: WalletService,
    private readonly usersService: UsersService,
    private readonly transactionsService: TransactionsService,
    private readonly emailService: EmailService,
  ) {}

  async createFromRequest(createInvestmentRequestDto: CreateInvestmentRequestDto, userId: string): Promise<Investment> {
    // Fetch the investment plan to get the required data
    const plan = await this.investmentPlanModel.findById(createInvestmentRequestDto.planId);
    if (!plan) {
      throw new NotFoundException('Investment plan not found');
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
      createInvestmentRequestDto.currency,
      WalletType.MAIN
    );

    if (!hasBalance) {
      const currentBalance = await this.walletService.getBalance(
        userId, 
        createInvestmentRequestDto.currency,
        WalletType.MAIN
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

    // Calculate bonuses
    const welcomeBonus = (createInvestmentRequestDto.amount * plan.welcomeBonus) / 100;
    const referralBonus = (createInvestmentRequestDto.amount * plan.referralBonus) / 100;

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

    // Set first active investment date for bonus withdrawal tracking
    await this.usersService.setFirstActiveInvestmentDate(userId);

    // Deduct the amount from user's main wallet
    await this.walletService.withdraw(userId, {
      walletType: WalletType.MAIN,
      amount: createInvestmentRequestDto.amount,
      currency: createInvestmentRequestDto.currency,
      description: `Investment in ${plan.name}`,
    });

    // Process referral bonus if user was referred by someone
    const user = await this.usersService.findById(userId);
    if (user.referredBy && referralBonus > 0) {
      // Add referral bonus to referrer's wallet
      await this.walletService.deposit(user.referredBy.toString(), {
        walletType: WalletType.PROFIT,
        amount: referralBonus,
        currency: createInvestmentRequestDto.currency,
        description: `Referral bonus from ${user.firstName} ${user.lastName}`,
      });

      // Update referrer's referral earnings
      await this.usersService.updateReferralStats(user.referredBy.toString(), referralBonus);

      // Create transaction record for referral bonus
      await this.transactionsService.create({
        userId: user.referredBy.toString(),
        type: TransactionType.REFERRAL,
        amount: referralBonus,
        currency: createInvestmentRequestDto.currency,
        description: `Referral bonus from ${user.firstName} ${user.lastName}`,
        status: TransactionStatus.SUCCESS,
        investmentId: investment._id.toString(),
      });
    }

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
          investmentId: investment._id.toString(),
        }
      );
    } catch (error) {
      // Log error but don't fail investment creation
      console.error('Failed to send investment confirmation email:', error);
    }

    return investment;
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
          totalEarned: { $sum: '$earnedAmount' },
          totalExpectedReturn: { $sum: '$expectedReturn' },
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

    return stats[0] || {
      totalInvestments: 0,
      totalAmount: 0,
      totalEarned: 0,
      totalExpectedReturn: 0,
      activeInvestments: 0,
      completedInvestments: 0,
      cancelledInvestments: 0,
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
    return this.investmentModel
      .find({ status: InvestmentStatus.ACTIVE })
      .populate('userId', 'firstName lastName email')
      .populate('planId', 'name description dailyRoi')
      .sort({ nextRoiUpdate: 1 })
      .exec();
  }

  // Handle bonus withdrawal with 15-day rule
  async withdrawBonus(userId: string): Promise<{ success: boolean; message: string; amount?: number }> {
    // Check if user can withdraw bonus
    const bonusStatus = await this.usersService.canWithdrawBonus(userId);
    
    if (!bonusStatus.canWithdraw) {
      return {
        success: false,
        message: `Bonus can only be withdrawn after 15 days. You have ${bonusStatus.daysLeft} days remaining.`
      };
    }

    // Get user's active investments to calculate total bonus
    const activeInvestments = await this.investmentModel.find({
      userId: new Types.ObjectId(userId),
      status: InvestmentStatus.ACTIVE
    });

    if (activeInvestments.length === 0) {
      return {
        success: false,
        message: 'You must have at least one active investment to withdraw bonuses.'
      };
    }

    // Calculate total bonus (welcome + referral bonuses from active investments)
    const totalBonus = activeInvestments.reduce((sum, investment) => {
      return sum + (investment.welcomeBonus || 0) + (investment.referralBonus || 0);
    }, 0);

    if (totalBonus <= 0) {
      return {
        success: false,
        message: 'No bonuses available for withdrawal.'
      };
    }

    // Get user to determine currency
    const user = await this.usersService.findById(userId);
    const currency = activeInvestments[0]?.currency || 'naira';

    // Add bonus to user's profit wallet
    await this.walletService.deposit(userId, {
      walletType: WalletType.PROFIT,
      amount: totalBonus,
      currency,
      description: 'Bonus withdrawal (Welcome + Referral bonuses)',
    });

    // Record the bonus withdrawal
    await this.usersService.recordBonusWithdrawal(userId);

    // Create transaction record
    await this.transactionsService.create({
      userId,
      type: TransactionType.BONUS,
      amount: totalBonus,
      currency,
      description: 'Bonus withdrawal (Welcome + Referral bonuses)',
      status: TransactionStatus.SUCCESS,
    });

    return {
      success: true,
      message: `Successfully withdrawn ${totalBonus} ${currency.toUpperCase()} in bonuses.`,
      amount: totalBonus
    };
  }
} 