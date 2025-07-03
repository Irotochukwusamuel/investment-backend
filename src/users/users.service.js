"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./schemas/user.schema");
const email_service_1 = require("../email/email.service");
const bcrypt = require("bcrypt");
let UsersService = class UsersService {
    userModel;
    emailService;
    constructor(userModel, emailService) {
        this.userModel = userModel;
        this.emailService = emailService;
    }
    async generateReferralCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code;
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
    async validateReferralCode(referralCode) {
        const referrer = await this.userModel.findOne({ referralCode });
        if (!referrer) {
            throw new common_1.BadRequestException('Invalid referral code');
        }
        if (!referrer.isActive) {
            throw new common_1.BadRequestException('Referral code belongs to an inactive user');
        }
        return referrer;
    }
    async canWithdrawBonus(userId) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const now = new Date();
        const BONUS_WAIT_DAYS = 15;
        if (!user.firstActiveInvestmentDate) {
            return { canWithdraw: false, daysLeft: BONUS_WAIT_DAYS };
        }
        let referenceDate;
        if (!user.lastBonusWithdrawalDate) {
            referenceDate = user.firstActiveInvestmentDate;
        }
        else {
            referenceDate = user.lastBonusWithdrawalDate;
        }
        const daysSinceReference = Math.floor((now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysLeft = Math.max(0, BONUS_WAIT_DAYS - daysSinceReference);
        const canWithdraw = daysLeft <= 0;
        let nextWithdrawalDate;
        if (!canWithdraw) {
            nextWithdrawalDate = new Date(referenceDate.getTime() + (BONUS_WAIT_DAYS * 24 * 60 * 60 * 1000));
        }
        return { canWithdraw, daysLeft, nextWithdrawalDate };
    }
    async recordBonusWithdrawal(userId) {
        await this.userModel.findByIdAndUpdate(userId, {
            lastBonusWithdrawalDate: new Date(),
            $inc: { totalBonusWithdrawals: 1 }
        });
    }
    async setFirstActiveInvestmentDate(userId) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!user.firstActiveInvestmentDate) {
            await this.userModel.findByIdAndUpdate(userId, {
                firstActiveInvestmentDate: new Date()
            });
        }
    }
    async updateReferralStats(userId, referralEarnings) {
        await this.userModel.findByIdAndUpdate(userId, {
            $inc: {
                referralCount: 1,
                totalReferralEarnings: referralEarnings
            }
        });
    }
    async create(createUserDto) {
        const { email, password, referralCode, ...rest } = createUserDto;
        const existingUser = await this.userModel.findOne({ email });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        let referredBy;
        if (referralCode) {
            try {
                const referrer = await this.validateReferralCode(referralCode);
                referredBy = referrer._id;
            }
            catch (error) {
                throw new common_1.BadRequestException('Invalid referral code');
            }
        }
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const userReferralCode = await this.generateReferralCode();
        const user = new this.userModel({
            ...rest,
            email: email.toLowerCase(),
            password: hashedPassword,
            referralCode: userReferralCode,
            referredBy,
        });
        const savedUser = await user.save();
        if (referredBy) {
            await this.updateReferralStats(referredBy.toString(), 0);
        }
        try {
            await this.emailService.sendWelcomeEmail(savedUser.email, savedUser.firstName || savedUser.email);
        }
        catch (error) {
            console.error('Failed to send welcome email:', error);
        }
        return savedUser;
    }
    async findAll() {
        return this.userModel.find({ isActive: true }).select('-password').exec();
    }
    async findById(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        const user = await this.userModel.findById(id).select('-password').exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findByEmail(email) {
        const user = await this.userModel.findOne({ email: email.toLowerCase() }).exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findByEmailForAuth(email) {
        return this.userModel.findOne({ email: email.toLowerCase() }).exec();
    }
    async update(id, updateUserDto) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        const user = await this.userModel.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existingUser = await this.userModel.findOne({ email: updateUserDto.email.toLowerCase() });
            if (existingUser) {
                throw new common_1.ConflictException('User with this email already exists');
            }
            updateUserDto.email = updateUserDto.email.toLowerCase();
        }
        if (updateUserDto.password) {
            const saltRounds = 12;
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, saltRounds);
        }
        const updatedUser = await this.userModel
            .findByIdAndUpdate(id, updateUserDto, { new: true })
            .select('-password')
            .exec();
        if (!updatedUser) {
            throw new common_1.NotFoundException('User not found');
        }
        return updatedUser;
    }
    async remove(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        const user = await this.userModel.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.userModel.findByIdAndUpdate(id, { isActive: false });
    }
    async updateWalletBalance(userId, amount) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.walletBalance += amount;
        return user.save();
    }
    async updateTotalInvested(userId, amount) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.totalInvested += amount;
        return user.save();
    }
    async updateTotalEarnings(userId, amount) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.totalEarnings += amount;
        return user.save();
    }
    async verifyEmail(userId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        return user.save();
    }
    async setEmailVerificationToken(userId, token, expiresAt) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        await this.userModel.findByIdAndUpdate(userId, {
            emailVerificationToken: token,
            emailVerificationExpires: expiresAt,
        });
    }
    async setPasswordResetToken(userId, token, expiresAt) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        await this.userModel.findByIdAndUpdate(userId, {
            passwordResetToken: token,
            passwordResetExpires: expiresAt,
        });
    }
    async resetPassword(token, newPassword) {
        const user = await this.userModel.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: new Date() },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        user.password = hashedPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
    }
    async updateLastLogin(userId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        await this.userModel.findByIdAndUpdate(userId, {
            lastLoginAt: new Date(),
        });
    }
    async incrementLoginAttempts(userId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        await this.userModel.findByIdAndUpdate(userId, {
            $inc: { loginAttempts: 1 },
        });
    }
    async resetLoginAttempts(userId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        await this.userModel.findByIdAndUpdate(userId, {
            loginAttempts: 0,
            lockUntil: undefined,
        });
    }
    async lockAccount(userId, lockUntil) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        await this.userModel.findByIdAndUpdate(userId, {
            lockUntil,
        });
    }
    async getUsersByRole(role) {
        return this.userModel.find({ role, isActive: true }).select('-password').exec();
    }
    async getUsersStats() {
        const stats = await this.userModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    activeUsers: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
                    verifiedUsers: { $sum: { $cond: [{ $eq: ['$isEmailVerified', true] }, 1, 0] } },
                    totalInvested: { $sum: '$totalInvested' },
                    totalEarnings: { $sum: '$totalEarnings' },
                },
            },
        ]);
        return stats[0] || {
            totalUsers: 0,
            activeUsers: 0,
            verifiedUsers: 0,
            totalInvested: 0,
            totalEarnings: 0,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        email_service_1.EmailService])
], UsersService);
//# sourceMappingURL=users.service.js.map