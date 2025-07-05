import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { BankDetails, BankDetailsDocument } from './schemas/bank-details.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateBankDetailsDto, UpdateBankDetailsDto } from './dto/bank-details.dto';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { Role } from './enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(BankDetails.name) private bankDetailsModel: Model<BankDetailsDocument>,
    private readonly emailService: EmailService,
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

  // Check if user can withdraw bonus (15-day rule)
  async canWithdrawBonus(userId: string): Promise<{ canWithdraw: boolean; daysLeft: number; nextWithdrawalDate?: Date }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();
    const BONUS_WAIT_DAYS = 15;

    // If user has never had an active investment, they can't withdraw
    if (!user.firstActiveInvestmentDate) {
      return { canWithdraw: false, daysLeft: BONUS_WAIT_DAYS };
    }

    let referenceDate: Date;
    
    if (!user.lastBonusWithdrawalDate) {
      // First withdrawal - use first active investment date
      referenceDate = user.firstActiveInvestmentDate;
    } else {
      // Subsequent withdrawals - use last withdrawal date
      referenceDate = user.lastBonusWithdrawalDate;
    }

    const daysSinceReference = Math.floor((now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, BONUS_WAIT_DAYS - daysSinceReference);
    const canWithdraw = daysLeft <= 0;

    let nextWithdrawalDate: Date | undefined;
    if (!canWithdraw) {
      nextWithdrawalDate = new Date(referenceDate.getTime() + (BONUS_WAIT_DAYS * 24 * 60 * 60 * 1000));
    }

    return { canWithdraw, daysLeft, nextWithdrawalDate };
  }

  // Record bonus withdrawal
  async recordBonusWithdrawal(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      lastBonusWithdrawalDate: new Date(),
      $inc: { totalBonusWithdrawals: 1 }
    });
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
} 