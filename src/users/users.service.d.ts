import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmailService } from '../email/email.service';
import { Role } from './enums/role.enum';
export declare class UsersService {
    private userModel;
    private readonly emailService;
    constructor(userModel: Model<UserDocument>, emailService: EmailService);
    private generateReferralCode;
    validateReferralCode(referralCode: string): Promise<User>;
    canWithdrawBonus(userId: string): Promise<{
        canWithdraw: boolean;
        daysLeft: number;
        nextWithdrawalDate?: Date;
    }>;
    recordBonusWithdrawal(userId: string): Promise<void>;
    setFirstActiveInvestmentDate(userId: string): Promise<void>;
    updateReferralStats(userId: string, referralEarnings: number): Promise<void>;
    create(createUserDto: CreateUserDto): Promise<User>;
    findAll(): Promise<User[]>;
    findById(id: string): Promise<User>;
    findByEmail(email: string): Promise<User>;
    findByEmailForAuth(email: string): Promise<User | null>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<User>;
    remove(id: string): Promise<void>;
    updateWalletBalance(userId: string, amount: number): Promise<User>;
    updateTotalInvested(userId: string, amount: number): Promise<User>;
    updateTotalEarnings(userId: string, amount: number): Promise<User>;
    verifyEmail(userId: string): Promise<User>;
    setEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void>;
    setPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void>;
    resetPassword(token: string, newPassword: string): Promise<void>;
    updateLastLogin(userId: string): Promise<void>;
    incrementLoginAttempts(userId: string): Promise<void>;
    resetLoginAttempts(userId: string): Promise<void>;
    lockAccount(userId: string, lockUntil: Date): Promise<void>;
    getUsersByRole(role: Role): Promise<User[]>;
    getUsersStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        verifiedUsers: number;
        totalInvested: number;
        totalEarnings: number;
    }>;
}
