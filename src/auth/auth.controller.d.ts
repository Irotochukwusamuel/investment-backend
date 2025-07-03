import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    forgotPassword(body: {
        email: string;
    }): Promise<{
        message: string;
    }>;
    resetPassword(body: {
        token: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
    sendOtp(body: {
        email: string;
        type: 'email_verification' | 'password_reset' | 'login';
    }): Promise<{
        message: string;
        expiresAt?: undefined;
    } | {
        message: string;
        expiresAt: Date;
    }>;
    verifyOtp(body: {
        email: string;
        otp: string;
        type: 'email_verification' | 'password_reset' | 'login';
    }): Promise<{
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
    resendOtp(body: {
        email: string;
        type: 'email_verification' | 'password_reset' | 'login';
    }): Promise<{
        message: string;
        expiresAt?: undefined;
    } | {
        message: string;
        expiresAt: Date;
    }>;
    resetPasswordWithOtp(body: {
        email: string;
        resetToken: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
}
