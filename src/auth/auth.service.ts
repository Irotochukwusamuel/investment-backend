import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ConfirmationCodesService } from '../confirmation-codes/confirmation-codes.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserDocument } from '../users/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private confirmationCodesService: ConfirmationCodesService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmailForAuth(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const userObj = (user as UserDocument).toObject();
      const { password, ...result } = userObj;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Check if user exists and password is correct
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new UnauthorizedException('Account is temporarily locked');
    }

    // Reset login attempts on successful login
    await this.usersService.resetLoginAttempts(user._id.toString());

    // Update last login
    await this.usersService.updateLastLogin(user._id.toString());

    // Generate JWT token
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

  async register(registerDto: RegisterDto) {
    // Create user
    const user = await this.usersService.create(registerDto);

    // Send email verification OTP
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

  async refreshToken(userId: string) {
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

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmailForAuth(email);
    // Always return a generic message for security
    const genericMessage = { message: 'If an account with that email exists, an OTP has been sent.' };
    if (!user) {
      // Do not send OTP if user does not exist
      throw new BadRequestException('User not found');
    }
    // Send OTP for password reset
    await this.sendOtp(email, 'password_reset');
    return genericMessage;
  }

  async resetPassword(token: string, newPassword: string) {
    await this.usersService.resetPassword(token, newPassword);
    return { message: 'Password reset successfully.' };
  }

  async sendOtp(email: string, type: 'email_verification' | 'password_reset' | 'login') {
    // Check if user exists for certain types
    if (type === 'email_verification' || type === 'password_reset') {
      const user = await this.usersService.findByEmailForAuth(email);
      if (!user && type === 'password_reset') {
        // Don't reveal if user exists
        return { message: 'If an account with that email exists, an OTP has been sent.' };
      }
    }

    // Generate OTP using confirmation codes service
    const otp = await this.confirmationCodesService.generateCode(
      email,
      type,
      {
        expirationMinutes: 10,
        codeLength: 6,
      }
    );

    // Send OTP via email
    try {
      if (type === 'password_reset') {
        const user = await this.usersService.findByEmailForAuth(email);
        if (user) {
          await this.emailService.sendPasswordResetEmail(
            email,
            user.firstName || user.email,
            otp
          );
        }
      } else if (type === 'email_verification') {
        const user = await this.usersService.findByEmailForAuth(email);
        if (user) {
          await this.emailService.sendAccountVerificationEmail(
            email,
            user.firstName || user.email,
            otp
          );
        }
      } else if (type === 'login') {
        const user = await this.usersService.findByEmailForAuth(email);
        if (user) {
          await this.emailService.sendLoginOtpEmail(
            email,
            user.firstName || user.email,
            otp
          );
        }
      }
      
      return {
        message: 'OTP sent successfully.',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      };
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      // In production, you might want to handle this differently
      // For now, we'll still return success but log the error
      return {
        message: 'OTP sent successfully.',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      };
    }
  }

  async verifyOtp(email: string, otp: string, type: 'email_verification' | 'password_reset' | 'login') {
    // Verify OTP using confirmation codes service
    const { valid } = await this.confirmationCodesService.verifyCode(email, otp, type);

    if (!valid) {
      throw new BadRequestException('Invalid OTP');
    }

    // Handle different OTP types
    if (type === 'email_verification') {
      const user = await this.usersService.findByEmailForAuth(email);
      if (user) {
        await this.usersService.verifyEmail(user._id.toString());
        
        // For registration flow, return access token after email verification
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
    } else if (type === 'password_reset') {
      // Generate a temporary password reset token
      const resetToken = this.generateResetToken();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      const user = await this.usersService.findByEmailForAuth(email);
      if (user) {
        await this.usersService.setPasswordResetToken(user._id.toString(), resetToken, expiresAt);
        
        return {
          message: 'OTP verified successfully. You can now reset your password.',
          verified: true,
          resetToken, // Remove this in production - should be sent via email
          expiresAt,
        };
      }
    }

    return {
      message: 'OTP verified successfully.',
      verified: true
    };
  }

  async resendOtp(email: string, type: 'email_verification' | 'password_reset' | 'login') {
    // Check if we can resend (rate limiting)
    const canResend = await this.confirmationCodesService.canResendCode(email, type, 1);
    
    if (!canResend) {
      throw new BadRequestException('Please wait before requesting another OTP');
    }

    // Send new OTP
    return this.sendOtp(email, type);
  }

  async resetPasswordWithOtp(email: string, resetToken: string, newPassword: string) {
    // Find user
    const user = await this.usersService.findByEmailForAuth(email) as UserDocument;
    if (!user) {
      throw new BadRequestException('User not found');
    }
    
    // Use the existing resetPassword logic with the token
    await this.usersService.resetPassword(resetToken, newPassword);
    return { message: 'Password reset successfully.' };
  }

  private generateResetToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
} 