import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { BankDetails, BankDetailsDocument } from './schemas/bank-details.schema';
import { Investment, InvestmentDocument } from '../investments/schemas/investment.schema';
import { Settings, SettingsDocument } from '../schemas/settings.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateBankDetailsDto, UpdateBankDetailsDto } from './dto/bank-details.dto';
import { EmailService } from '../email/email.service';
import { WalletService } from '../wallet/wallet.service';
import { ReferralsService } from '../referrals/referrals.service';
import * as bcrypt from 'bcrypt';
import { Role } from './enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(BankDetails.name) private bankDetailsModel: Model<BankDetailsDocument>,
    @InjectModel(Investment.name) private investmentModel: Model<InvestmentDocument>,
    @InjectModel(Settings.name) private settingsModel: Model<SettingsDocument>,
    private readonly emailService: EmailService,
    private readonly walletService: WalletService,
    @Inject(forwardRef(() => ReferralsService))
    private readonly referralsService: ReferralsService,
  ) {}

  // Generate unique referral code
  private async generateReferralCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      attempts++;
      
      if (attempts > maxAttempts) {
        throw new Error('Unable to generate unique referral code');
      }
    } while (await this.userModel.findOne({ referralCode: code }));

    return code;
  }

  // Validate referral code
  async validateReferralCode(referralCode: string): Promise<User> {
    const referrer = await this.userModel.findOne({ referralCode });
    if (!referrer) {
      throw new BadRequestException('Invalid referral code');
    }
    if (!referrer.isActive) {
      throw new BadRequestException('Referral code belongs to an inactive user');
    }
    return referrer;
  }

  // Check if user can withdraw bonus (configurable period rule)
  async canWithdrawBonus(userId: string): Promise<{ canWithdraw: boolean; daysLeft: number; nextWithdrawalDate?: Date; timeLeft?: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();
    
    // Get bonus withdrawal period from settings (default to 15 days)
    let BONUS_WAIT_DAYS = 15;
    let BONUS_WAIT_UNIT = 'days';
    let BONUS_WAIT_MS = 15 * 24 * 60 * 60 * 1000; // 15 days in milliseconds
    
    try {
      const settings = await this.settingsModel.findOne({ key: 'platform' });
      if (settings?.value?.bonusWithdrawalPeriod) {
        BONUS_WAIT_DAYS = settings.value.bonusWithdrawalPeriod;
        BONUS_WAIT_UNIT = settings.value.bonusWithdrawalUnit || 'days';
        BONUS_WAIT_MS = settings.value.bonusWithdrawalPeriodMs || (BONUS_WAIT_DAYS * 24 * 60 * 60 * 1000);
      }
    } catch (error) {
      console.error('Error fetching bonus withdrawal period from settings:', error);
      // Fallback to default 15 days
    }

    // If user has never had an active investment, they can't withdraw
    if (!user.firstActiveInvestmentDate) {
      return { 
        canWithdraw: false, 
        daysLeft: BONUS_WAIT_DAYS,
        timeLeft: `${BONUS_WAIT_DAYS} ${BONUS_WAIT_UNIT}`
      };
    }

    // Check if user has already completed their first period
    const timeSinceFirstInvestment = now.getTime() - user.firstActiveInvestmentDate.getTime();
    
    // If user has never withdrawn bonus and hasn't completed the required period, they need to wait
    if (!user.lastBonusWithdrawalDate && timeSinceFirstInvestment < BONUS_WAIT_MS) {
      const remainingMs = BONUS_WAIT_MS - timeSinceFirstInvestment;
      const nextWithdrawalDate = new Date(user.firstActiveInvestmentDate.getTime() + BONUS_WAIT_MS);
      
      // Calculate remaining time in the appropriate unit
      let timeLeft: string;
      let daysLeft: number;
      
      if (BONUS_WAIT_UNIT === 'minutes') {
        daysLeft = Math.max(0, Math.ceil(remainingMs / (60 * 1000)));
        timeLeft = `${daysLeft} minutes`;
      } else if (BONUS_WAIT_UNIT === 'hours') {
        daysLeft = Math.max(0, Math.ceil(remainingMs / (60 * 60 * 1000)));
        timeLeft = `${daysLeft} hours`;
      } else {
        // For days, show more detailed format
        daysLeft = Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
        if (daysLeft > 0) {
          timeLeft = `${daysLeft} days`;
        } else {
          // If less than a day, show hours
          const hoursLeft = Math.max(0, Math.ceil(remainingMs / (60 * 60 * 1000)));
          timeLeft = `${hoursLeft} hours`;
        }
      }
      
      return { 
        canWithdraw: false, 
        daysLeft, 
        nextWithdrawalDate,
        timeLeft
      };
    }

    // If user has completed the initial period OR has already withdrawn before, they can withdraw anytime
    return { 
      canWithdraw: true, 
      daysLeft: 0,
      timeLeft: '0'
    };
  }

  // Record bonus withdrawal
  async recordBonusWithdrawal(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      { 
        $set: { lastBonusWithdrawalDate: new Date() },
        $inc: { totalBonusWithdrawals: 1 }
      }
    );
  }

  // Mark that user has received welcome bonus
  async markWelcomeBonusGiven(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      { 
        $set: { 
          welcomeBonusGiven: true,
          welcomeBonusGivenAt: new Date()
        }
      }
    );
  }

  // Set first active investment date
  async setFirstActiveInvestmentDate(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only set if not already set
    if (!user.firstActiveInvestmentDate) {
      await this.userModel.findByIdAndUpdate(userId, {
        firstActiveInvestmentDate: new Date()
      });
    }
  }

  // Update referral count and earnings
  async updateReferralStats(userId: string, referralEarnings: number): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $inc: { 
        referralCount: 1,
        totalReferralEarnings: referralEarnings
      }
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, referralCode, ...rest } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate referral code if provided
    let referredBy: Types.ObjectId | undefined;
    if (referralCode) {
      try {
        const referrer = await this.validateReferralCode(referralCode);
        referredBy = referrer._id;
      } catch (error) {
        throw new BadRequestException('Invalid referral code');
      }
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate unique referral code for new user
    const userReferralCode = await this.generateReferralCode();

    // Create user
    const user = new this.userModel({
      ...rest,
      email: email.toLowerCase(),
      password: hashedPassword,
      referralCode: userReferralCode,
      referredBy,
    });

    const savedUser = await user.save();

    // Update referrer's stats if applicable
    if (referredBy) {
      await this.updateReferralStats(referredBy.toString(), 0); // Will be updated when investment is made
    }

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(savedUser.email, savedUser.firstName || savedUser.email);
    } catch (error) {
      // Log error but don't fail user creation
      console.error('Failed to send welcome email:', error);
    }

    // Automatically create default wallets for new users
    await this.walletService.createDefaultWallets(savedUser._id.toString());

    // Create referral relationship if referral code was provided
    if (referredBy) {
      try {
        await this.referralsService.create({
          referrerId: referredBy.toString(),
          referredUserId: savedUser._id.toString(),
          referralCode: referralCode!,
          status: 'pending',
          isActive: false
        });
        console.log(`✅ Referral created for user ${savedUser.email}`);
      } catch (error) {
        console.error('Failed to create referral:', error);
        // Don't fail user creation if referral creation fails
      }
    }

    return savedUser;
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find({ isActive: true }).select('-password').exec();
  }

  async findById(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email: email.toLowerCase() }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmailForAuth(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If email is being updated, check for conflicts
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userModel.findOne({ email: updateUserDto.email.toLowerCase() });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
      updateUserDto.email = updateUserDto.email.toLowerCase();
    }

    // If password is being updated, hash it
    if (updateUserDto.password) {
      const saltRounds = 12;
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, saltRounds);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete - set isActive to false
    await this.userModel.findByIdAndUpdate(id, { isActive: false });
  }

  async updateWalletBalance(userId: string, amount: number): Promise<User> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.walletBalance += amount;
    return user.save();
  }

  async updateTotalInvested(userId: string, amount: number): Promise<User> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.totalInvested += amount;
    return user.save();
  }

  async updateTotalEarnings(userId: string, amount: number): Promise<User> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.totalEarnings += amount;
    return user.save();
  }

  async verifyEmail(userId: string): Promise<User> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    return user.save();
  }

  async setEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    await this.userModel.findByIdAndUpdate(userId, {
      emailVerificationToken: token,
      emailVerificationExpires: expiresAt,
    });
  }

  async setPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    await this.userModel.findByIdAndUpdate(userId, {
      passwordResetToken: token,
      passwordResetExpires: expiresAt,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }

  async updateLastLogin(userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    await this.userModel.findByIdAndUpdate(userId, {
      lastLoginAt: new Date(),
    });
  }

  async incrementLoginAttempts(userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    await this.userModel.findByIdAndUpdate(userId, {
      $inc: { loginAttempts: 1 },
    });
  }

  async resetLoginAttempts(userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    await this.userModel.findByIdAndUpdate(userId, {
      loginAttempts: 0,
      lockUntil: undefined,
    });
  }

  async lockAccount(userId: string, lockUntil: Date): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    await this.userModel.findByIdAndUpdate(userId, {
      lockUntil,
    });
  }

  async getUsersByRole(role: Role): Promise<User[]> {
    return this.userModel.find({ role, isActive: true }).select('-password').exec();
  }

  async getUsersStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    totalInvested: number;
    totalEarnings: number;
  }> {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      totalInvested,
      totalEarnings,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ isActive: true }),
      this.userModel.countDocuments({ emailVerified: true }),
      this.userModel.aggregate([
        { $group: { _id: null, total: { $sum: '$totalInvested' } } }
      ]).then(result => result[0]?.total || 0),
      this.userModel.aggregate([
        { $group: { _id: null, total: { $sum: '$totalEarnings' } } }
      ]).then(result => result[0]?.total || 0),
    ]);

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      totalInvested,
      totalEarnings,
    };
  }

  // Bank Details Methods
  async createBankDetails(userId: string, createBankDetailsDto: CreateBankDetailsDto): Promise<BankDetails> {
    // Check if user exists
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Deactivate existing bank details
    await this.bankDetailsModel.updateMany(
      { userId: new Types.ObjectId(userId) },
      { isActive: false }
    );

    // Create new bank details
    const bankDetails = new this.bankDetailsModel({
      ...createBankDetailsDto,
      userId: new Types.ObjectId(userId),
      isActive: true,
      isVerified: true, // Mark as verified since it's coming from FINTAVA verification
      verifiedAt: new Date(),
    });

    return bankDetails.save();
  }

  async updateBankDetails(userId: string, bankDetailsId: string, updateBankDetailsDto: UpdateBankDetailsDto): Promise<BankDetails> {
    if (!Types.ObjectId.isValid(bankDetailsId)) {
      throw new BadRequestException('Invalid bank details ID');
    }

    const bankDetails = await this.bankDetailsModel.findOne({
      _id: bankDetailsId,
      userId: new Types.ObjectId(userId),
    });

    if (!bankDetails) {
      throw new NotFoundException('Bank details not found');
    }

    Object.assign(bankDetails, updateBankDetailsDto);
    return bankDetails.save();
  }

  async getBankDetails(userId: string): Promise<BankDetails[]> {
    return this.bankDetailsModel.find({
      userId: new Types.ObjectId(userId),
      isActive: true,
    }).sort({ createdAt: -1 }).exec();
  }

  async getBankDetailsById(userId: string, bankDetailsId: string): Promise<BankDetails> {
    if (!Types.ObjectId.isValid(bankDetailsId)) {
      throw new BadRequestException('Invalid bank details ID');
    }

    const bankDetails = await this.bankDetailsModel.findOne({
      _id: bankDetailsId,
      userId: new Types.ObjectId(userId),
    });

    if (!bankDetails) {
      throw new NotFoundException('Bank details not found');
    }

    return bankDetails;
  }

  async deleteBankDetails(userId: string, bankDetailsId: string): Promise<void> {
    if (!Types.ObjectId.isValid(bankDetailsId)) {
      throw new BadRequestException('Invalid bank details ID');
    }

    const result = await this.bankDetailsModel.deleteOne({
      _id: bankDetailsId,
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Bank details not found');
    }
  }

  async getActiveBankDetails(userId: string): Promise<BankDetails | null> {
    return this.bankDetailsModel.findOne({
      userId: new Types.ObjectId(userId),
      isActive: true,
    }).exec();
  }

  async getMyReferrals(userId: string) {
    console.log(`🔍 Fetching referrals for user: ${userId}`);
    
    const referrals = await this.userModel.find({
      referredBy: new Types.ObjectId(userId)
    }).select('firstName lastName email isActive createdAt lastLoginAt totalInvested totalEarnings').exec();

    console.log(`📊 Found ${referrals.length} referrals for user ${userId}`);

    // Calculate additional stats for each referral
    const referralsWithStats = await Promise.all(
      referrals.map(async (referral) => {
        // Get active investments count
        const activeInvestments = await this.investmentModel.countDocuments({
          userId: referral._id,
          status: 'active'
        });

        // Calculate total earnings from investments
        const totalEarnings = await this.investmentModel.aggregate([
          { $match: { userId: referral._id } },
          { $group: { _id: null, total: { $sum: '$earnedAmount' } } }
        ]).then(result => result[0]?.total || 0);

        console.log(`📈 Referral ${referral.email}: ${activeInvestments} active investments, ₦${totalEarnings} total earnings`);

        return {
          id: referral._id,
          firstName: referral.firstName,
          lastName: referral.lastName,
          email: referral.email,
          isActive: referral.isActive,
          totalEarnings: totalEarnings,
          totalInvestments: activeInvestments,
          createdAt: (referral as any).createdAt || new Date(),
          lastLoginAt: referral.lastLoginAt
        };
      })
    );

    const result = {
      success: true,
      data: referralsWithStats,
      total: referralsWithStats.length
    };

    console.log(`✅ Returning ${result.total} referrals with complete statistics`);
    return result;
  }

  // Method to verify referral data storage
  async verifyReferralStorage(userId: string): Promise<{
    hasReferralCode: boolean;
    referralCode: string | null;
    referredBy: string | null;
    referralCount: number;
    totalReferralEarnings: number;
    referredUsers: number;
  }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Count users referred by this user
    const referredUsersCount = await this.userModel.countDocuments({
      referredBy: new Types.ObjectId(userId)
    });

    return {
      hasReferralCode: !!user.referralCode,
      referralCode: user.referralCode || null,
      referredBy: user.referredBy?.toString() || null,
      referralCount: user.referralCount,
      totalReferralEarnings: user.totalReferralEarnings,
      referredUsers: referredUsersCount
    };
  }
} 