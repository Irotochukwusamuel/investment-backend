import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Referral, ReferralDocument } from './schemas/referral.schema';
import { CreateReferralDto } from './dto/create-referral.dto';
import { UpdateReferralDto } from './dto/update-referral.dto';
import { User } from '../users/schemas/user.schema';
import { Investment } from '../investments/schemas/investment.schema';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectModel(Referral.name) private referralModel: Model<ReferralDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Investment.name) private investmentModel: Model<Investment>,
  ) {}

  async create(createReferralDto: CreateReferralDto): Promise<Referral> {
    // Check if referral already exists for this user
    const existingReferral = await this.referralModel.findOne({
      referredUserId: new Types.ObjectId(createReferralDto.referredUserId)
    });

    if (existingReferral) {
      throw new ConflictException('User already has a referral relationship');
    }

    // Validate that both users exist
    const [referrer, referredUser] = await Promise.all([
      this.userModel.findById(createReferralDto.referrerId),
      this.userModel.findById(createReferralDto.referredUserId)
    ]);

    if (!referrer) {
      throw new NotFoundException('Referrer user not found');
    }

    if (!referredUser) {
      throw new NotFoundException('Referred user not found');
    }

    // Create the referral
    const referral = new this.referralModel({
      ...createReferralDto,
      referrerId: new Types.ObjectId(createReferralDto.referrerId),
      referredUserId: new Types.ObjectId(createReferralDto.referredUserId),
      status: createReferralDto.status || 'pending',
      isActive: createReferralDto.isActive || false,
    });

    const savedReferral = await referral.save();

    // Update referrer's referral count
    await this.userModel.findByIdAndUpdate(
      createReferralDto.referrerId,
      { $inc: { referralCount: 1 } }
    );

    console.log(`✅ Referral created: ${referrer.email} referred ${referredUser.email}`);
    return savedReferral;
  }

  async findAll(): Promise<Referral[]> {
    return this.referralModel.find()
      .populate('referrer', 'firstName lastName email')
      .populate('referredUser', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByReferrer(referrerId: string): Promise<Referral[]> {
    return this.referralModel.find({ referrerId: new Types.ObjectId(referrerId) })
      .populate('referredUser', 'firstName lastName email isActive createdAt lastLoginAt')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByReferredUser(referredUserId: string): Promise<Referral | null> {
    return this.referralModel.findOne({ referredUserId: new Types.ObjectId(referredUserId) })
      .populate('referrer', 'firstName lastName email')
      .exec();
  }

  async findOne(id: string): Promise<Referral> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid referral ID');
    }

    const referral = await this.referralModel.findById(id)
      .populate('referrer', 'firstName lastName email')
      .populate('referredUser', 'firstName lastName email')
      .exec();

    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    return referral;
  }

  async update(id: string, updateReferralDto: UpdateReferralDto): Promise<Referral> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid referral ID');
    }

    const referral = await this.referralModel.findByIdAndUpdate(
      id,
      updateReferralDto,
      { new: true }
    ).populate('referrer', 'firstName lastName email')
     .populate('referredUser', 'firstName lastName email')
     .exec();

    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    return referral;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid referral ID');
    }

    const referral = await this.referralModel.findById(id);
    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    // Decrease referrer's referral count
    await this.userModel.findByIdAndUpdate(
      referral.referrerId,
      { $inc: { referralCount: -1 } }
    );

    await this.referralModel.findByIdAndDelete(id);
  }

  async getReferralStats(referrerId: string): Promise<{
    totalReferrals: number;
    activeReferrals: number;
    totalEarnings: number;
    totalBonus: number;
    pendingBonus: number;
  }> {
    const referrals = await this.referralModel.find({
      referrerId: new Types.ObjectId(referrerId)
    });

    const stats = {
      totalReferrals: referrals.length,
      activeReferrals: referrals.filter(r => r.isActive).length,
      totalEarnings: referrals.reduce((sum, r) => sum + r.totalEarnings, 0),
      totalBonus: referrals.reduce((sum, r) => sum + r.referralBonus, 0),
      pendingBonus: referrals.filter(r => !r.bonusPaid).reduce((sum, r) => sum + r.referralBonus, 0)
    };

    return stats;
  }

  async updateReferralStats(referredUserId: string): Promise<void> {
    const referral = await this.referralModel.findOne({
      referredUserId: new Types.ObjectId(referredUserId)
    });

    if (!referral) {
      return; // No referral relationship
    }

    // Get user's investment statistics
    const [activeInvestments, totalEarnings] = await Promise.all([
      this.investmentModel.countDocuments({
        userId: new Types.ObjectId(referredUserId),
        status: 'active'
      }),
      this.investmentModel.aggregate([
        { $match: { userId: new Types.ObjectId(referredUserId) } },
        { $group: { _id: null, total: { $sum: '$earnedAmount' } } }
      ]).then(result => result[0]?.total || 0)
    ]);

    // Update referral with new stats
    const updateData: any = {
      totalInvestments: activeInvestments,
      totalEarnings: totalEarnings,
      isActive: activeInvestments > 0,
      lastActivityAt: new Date()
    };

    // Update status based on activity
    if (activeInvestments > 0) {
      updateData.status = 'active';
      if (!referral.firstInvestmentAt) {
        updateData.firstInvestmentAt = new Date();
      }
    } else {
      updateData.status = 'inactive';
    }

    await this.referralModel.findByIdAndUpdate(referral._id, updateData);

    // Update referrer's total referral earnings
    await this.userModel.findByIdAndUpdate(
      referral.referrerId,
      { 
        $inc: { 
          totalReferralEarnings: totalEarnings - referral.totalEarnings 
        }
      }
    );

    console.log(`📊 Updated referral stats for user ${referredUserId}: ${activeInvestments} active investments, ₦${totalEarnings} total earnings`);
  }

  async markBonusAsPaid(referralId: string, amount: number): Promise<Referral> {
    const referral = await this.referralModel.findById(referralId);
    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    referral.bonusPaid = true;
    referral.bonusPaidAt = new Date();
    referral.referralBonus = amount;

    return referral.save();
  }

  async markWelcomeBonusAsPaid(referralId: string): Promise<Referral> {
    const referral = await this.referralModel.findById(referralId);
    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    referral.welcomeBonusPaid = true;
    referral.welcomeBonusPaidAt = new Date();

    return referral.save();
  }

  async getReferralsWithDetails(referrerId: string): Promise<any[]> {
    const referrals = await this.referralModel.find({
      referrerId: new Types.ObjectId(referrerId)
    }).populate('referredUser', 'firstName lastName email isActive createdAt lastLoginAt')
      .sort({ createdAt: -1 })
      .exec();

    return referrals.map(referral => ({
      id: referral._id,
      firstName: (referral as any).referredUser?.firstName,
      lastName: (referral as any).referredUser?.lastName,
      email: (referral as any).referredUser?.email,
      isActive: referral.isActive,
      totalEarnings: referral.totalEarnings,
      totalInvestments: referral.totalInvestments,
      referralBonus: referral.referralBonus,
      bonusPaid: referral.bonusPaid,
      status: referral.status,
      createdAt: referral.createdAt,
      lastActivityAt: referral.lastActivityAt,
      firstInvestmentAt: referral.firstInvestmentAt
    }));
  }
} 