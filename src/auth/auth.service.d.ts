import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ConfirmationCodesService } from '../confirmation-codes/confirmation-codes.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { EmailService } from '../email/email.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    private confirmationCodesService;
    private emailService;
    constructor(usersService: UsersService, jwtService: JwtService, confirmationCodesService: ConfirmationCodesService, emailService: EmailService);
    validateUser(email: string, password: string): Promise<any>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            firstName: any;
            lastName: any;
            role: any;
            isEmailVerified: any;
            walletBalance: any;
            totalInvested: any;
            totalEarnings: any;
        };
    }>;
    register(registerDto: RegisterDto): Promise<{
        message: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            email: string;
            firstName: string;
            lastName: string;
            isEmailVerified: boolean;
        };
        requiresEmailVerification: boolean;
    }>;
    refreshToken(userId: string): Promise<{
        access_token: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    sendOtp(email: string, type: 'email_verification' | 'password_reset' | 'login'): Promise<{
        message: string;
        expiresAt?: undefined;
    } | {
        message: string;
        expiresAt: Date;
    }>;
    verifyOtp(email: string, otp: string, type: 'email_verification' | 'password_reset' | 'login'): Promise<{
        message: string;
        verified: boolean;
        access_token: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            email: string;
            firstName: string;
            lastName: string;
            role: import("../users/enums/role.enum").Role;
            isEmailVerified: boolean;
            walletBalance: number;
            totalInvested: number;
            totalEarnings: number;
        };
        resetToken?: undefined;
        expiresAt?: undefined;
    } | {
        message: string;
        verified: boolean;
        resetToken: string;
        expiresAt: Date;
        access_token?: undefined;
        user?: undefined;
    } | {
        message: string;
        verified: boolean;
        access_token?: undefined;
        user?: undefined;
        resetToken?: undefined;
        expiresAt?: undefined;
    }>;
    resendOtp(email: string, type: 'email_verification' | 'password_reset' | 'login'): Promise<{
        message: string;
        expiresAt?: undefined;
    } | {
        message: string;
        expiresAt: Date;
    }>;
    resetPasswordWithOtp(email: string, resetToken: string, newPassword: string): Promise<{
        message: string;
    }>;
    private generateResetToken;
}
