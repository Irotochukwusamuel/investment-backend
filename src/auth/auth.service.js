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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../users/users.service");
const confirmation_codes_service_1 = require("../confirmation-codes/confirmation-codes.service");
const bcrypt = require("bcrypt");
const email_service_1 = require("../email/email.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    confirmationCodesService;
    emailService;
    constructor(usersService, jwtService, confirmationCodesService, emailService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.confirmationCodesService = confirmationCodesService;
        this.emailService = emailService;
    }
    async validateUser(email, password) {
        const user = await this.usersService.findByEmailForAuth(email);
        if (user && await bcrypt.compare(password, user.password)) {
            const userObj = user.toObject();
            const { password, ...result } = userObj;
            return result;
        }
        return null;
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.validateUser(email, password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.lockUntil && user.lockUntil > new Date()) {
            throw new common_1.UnauthorizedException('Account is temporarily locked');
        }
        await this.usersService.resetLoginAttempts(user._id.toString());
        await this.usersService.updateLastLogin(user._id.toString());
        const payload = {
            sub: user._id,
            email: user.email,
            role: user.role
        };
        const token = this.jwtService.sign(payload);
        return {
            access_token: token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                walletBalance: user.walletBalance,
                totalInvested: user.totalInvested,
                totalEarnings: user.totalEarnings,
            },
        };
    }
    async register(registerDto) {
        const user = await this.usersService.create(registerDto);
        await this.sendOtp(user.email, 'email_verification');
        return {
            message: 'Registration successful! Please check your email for verification code.',
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isEmailVerified: user.isEmailVerified,
            },
            requiresEmailVerification: true,
        };
    }
    async refreshToken(userId) {
        const user = await this.usersService.findById(userId);
        const payload = {
            sub: user._id,
            email: user.email,
            role: user.role
        };
        const token = this.jwtService.sign(payload);
        return {
            access_token: token,
        };
    }
    async forgotPassword(email) {
        const user = await this.usersService.findByEmailForAuth(email);
        const genericMessage = { message: 'If an account with that email exists, an OTP has been sent.' };
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        await this.sendOtp(email, 'password_reset');
        return genericMessage;
    }
    async resetPassword(token, newPassword) {
        await this.usersService.resetPassword(token, newPassword);
        return { message: 'Password reset successfully.' };
    }
    async sendOtp(email, type) {
        if (type === 'email_verification' || type === 'password_reset') {
            const user = await this.usersService.findByEmailForAuth(email);
            if (!user && type === 'password_reset') {
                return { message: 'If an account with that email exists, an OTP has been sent.' };
            }
        }
        const otp = await this.confirmationCodesService.generateCode(email, type, {
            expirationMinutes: 10,
            codeLength: 6,
        });
        try {
            if (type === 'password_reset') {
                const user = await this.usersService.findByEmailForAuth(email);
                if (user) {
                    await this.emailService.sendPasswordResetEmail(email, user.firstName || user.email, otp);
                }
            }
            else if (type === 'email_verification') {
                const user = await this.usersService.findByEmailForAuth(email);
                if (user) {
                    await this.emailService.sendAccountVerificationEmail(email, user.firstName || user.email, otp);
                }
            }
            else if (type === 'login') {
                const user = await this.usersService.findByEmailForAuth(email);
                if (user) {
                    await this.emailService.sendLoginOtpEmail(email, user.firstName || user.email, otp);
                }
            }
            return {
                message: 'OTP sent successfully.',
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            };
        }
        catch (error) {
            console.error('Failed to send OTP email:', error);
            return {
                message: 'OTP sent successfully.',
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            };
        }
    }
    async verifyOtp(email, otp, type) {
        const { valid } = await this.confirmationCodesService.verifyCode(email, otp, type);
        if (!valid) {
            throw new common_1.BadRequestException('Invalid OTP');
        }
        if (type === 'email_verification') {
            const user = await this.usersService.findByEmailForAuth(email);
            if (user) {
                await this.usersService.verifyEmail(user._id.toString());
                const payload = {
                    sub: user._id,
                    email: user.email,
                    role: user.role
                };
                const token = this.jwtService.sign(payload);
                return {
                    message: 'Email verified successfully.',
                    verified: true,
                    access_token: token,
                    user: {
                        id: user._id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        isEmailVerified: true,
                        walletBalance: user.walletBalance,
                        totalInvested: user.totalInvested,
                        totalEarnings: user.totalEarnings,
                    },
                };
            }
        }
        else if (type === 'password_reset') {
            const resetToken = this.generateResetToken();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
            const user = await this.usersService.findByEmailForAuth(email);
            if (user) {
                await this.usersService.setPasswordResetToken(user._id.toString(), resetToken, expiresAt);
                return {
                    message: 'OTP verified successfully. You can now reset your password.',
                    verified: true,
                    resetToken,
                    expiresAt,
                };
            }
        }
        return {
            message: 'OTP verified successfully.',
            verified: true
        };
    }
    async resendOtp(email, type) {
        const canResend = await this.confirmationCodesService.canResendCode(email, type, 1);
        if (!canResend) {
            throw new common_1.BadRequestException('Please wait before requesting another OTP');
        }
        return this.sendOtp(email, type);
    }
    async resetPasswordWithOtp(email, resetToken, newPassword) {
        const user = await this.usersService.findByEmailForAuth(email);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        await this.usersService.resetPassword(resetToken, newPassword);
        return { message: 'Password reset successfully.' };
    }
    generateResetToken() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        confirmation_codes_service_1.ConfirmationCodesService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map