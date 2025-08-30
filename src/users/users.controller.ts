import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateBankDetailsDto, UpdateBankDetailsDto } from './dto/bank-details.dto';
import { User } from './schemas/user.schema';
import { BankDetails } from './schemas/bank-details.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from '../settings/settings.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService, private readonly settingsService: SettingsService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully', type: User })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: any): Promise<User> {
    return this.usersService.findById(req.user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: User })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@Request() req: any, @Body() updateUserDto: UpdateUserDto): Promise<User> {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  // Bank Details Endpoints
  @Post('bank-details')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update bank details' })
  @ApiResponse({ status: 201, description: 'Bank details created successfully', type: BankDetails })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createBankDetails(@Request() req: any, @Body() createBankDetailsDto: CreateBankDetailsDto): Promise<BankDetails> {
    return this.usersService.createBankDetails(req.user.id, createBankDetailsDto);
  }

  @Get('bank-details')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user bank details' })
  @ApiResponse({ status: 200, description: 'Bank details retrieved successfully', type: [BankDetails] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBankDetails(@Request() req: any): Promise<BankDetails[]> {
    return this.usersService.getBankDetails(req.user.id);
  }

  @Get('bank-details/active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active bank details' })
  @ApiResponse({ status: 200, description: 'Active bank details retrieved successfully', type: BankDetails })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getActiveBankDetails(@Request() req: any): Promise<BankDetails | null> {
    return this.usersService.getActiveBankDetails(req.user.id);
  }

  @Get('bank-details/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get bank details by ID' })
  @ApiResponse({ status: 200, description: 'Bank details retrieved successfully', type: BankDetails })
  @ApiResponse({ status: 404, description: 'Bank details not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBankDetailsById(@Request() req: any, @Param('id') id: string): Promise<BankDetails> {
    return this.usersService.getBankDetailsById(req.user.id, id);
  }

  @Patch('bank-details/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update bank details' })
  @ApiResponse({ status: 200, description: 'Bank details updated successfully', type: BankDetails })
  @ApiResponse({ status: 404, description: 'Bank details not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateBankDetails(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateBankDetailsDto: UpdateBankDetailsDto
  ): Promise<BankDetails> {
    return this.usersService.updateBankDetails(req.user.id, id, updateBankDetailsDto);
  }

  @Delete('bank-details/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete bank details' })
  @ApiResponse({ status: 204, description: 'Bank details deleted successfully' })
  @ApiResponse({ status: 404, description: 'Bank details not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteBankDetails(@Request() req: any, @Param('id') id: string): Promise<void> {
    return this.usersService.deleteBankDetails(req.user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: User })
  @ApiResponse({ status: 409, description: 'User with this email already exists' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users', type: [User] })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get users statistics' })
  @ApiResponse({ status: 200, description: 'Users statistics' })
  async getStats() {
    return this.usersService.getUsersStats();
  }

  @Get('referrals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user referrals' })
  @ApiResponse({ status: 200, description: 'User referrals retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyReferrals(@Request() req: any) {
    return this.usersService.getMyReferrals(req.user.id);
  }

  @Get('referrals/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify referral storage for current user' })
  @ApiResponse({ status: 200, description: 'Referral storage verification completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async verifyReferralStorage(@Request() req: any) {
    return this.usersService.verifyReferralStorage(req.user.id);
  }

  @Get('bonus-countdown')
  @UseGuards(JwtAuthGuard)
  async getBonusCountdown(@Request() req) {
    const userId = req.user.id;
    
    const result = await this.usersService.canWithdrawBonus(userId);
    
    // Calculate real-time countdown data
    const user = await this.usersService.findById(userId);
    const now = new Date();
    
    let countdownData = {
      canWithdraw: result.canWithdraw,
      timeLeft: result.timeLeft,
      daysLeft: result.daysLeft,
      nextWithdrawalDate: result.nextWithdrawalDate,
      progress: 0,
      timeLeftMs: 0,
      formattedTimeLeft: '0'
    };
    
    if (!result.canWithdraw) {
      // Get bonus withdrawal period from settings
      const settings = await this.settingsService.getBonusWithdrawalPeriod();
      const bonusPeriodMs = settings.periodMs;
      
      // Use first bonus received date for countdown calculation
      let startDate: Date;
      let timeElapsed: number;
      
      if (user.firstBonusReceivedAt) {
        // User has received bonuses, use first bonus received date
        startDate = user.firstBonusReceivedAt;
        timeElapsed = now.getTime() - user.firstBonusReceivedAt.getTime();
      } else {
        // No bonus received yet
        return {
          success: true,
          data: countdownData
        };
      }
      
      const remainingMs = Math.max(0, bonusPeriodMs - timeElapsed);
      
      // Calculate progress percentage
      const progress = Math.max(0, Math.min(100, (timeElapsed / bonusPeriodMs) * 100));
      
      // Format time left
      let formattedTimeLeft = '0';
      if (remainingMs > 0) {
        const totalMinutes = Math.floor(remainingMs / (60 * 1000));
        const totalHours = Math.floor(remainingMs / (60 * 60 * 1000));
        const totalDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
        
        if (totalMinutes < 60) {
          formattedTimeLeft = `${totalMinutes}m`;
        } else if (totalHours < 24) {
          const hours = Math.floor(remainingMs / (60 * 60 * 1000));
          const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
          formattedTimeLeft = `${hours}h ${minutes}m`;
        } else {
          const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
          const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
          if (hours > 0) {
            formattedTimeLeft = `${days}d ${hours}h`;
          } else {
            formattedTimeLeft = `${days}d`;
          }
        }
      }
      
      countdownData = {
        ...countdownData,
        progress,
        timeLeftMs: remainingMs,
        formattedTimeLeft
      };
    }
    
    return {
      success: true,
      data: countdownData
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }

  @Post(':id/verify-email')
  @ApiOperation({ summary: 'Verify user email' })
  @ApiResponse({ status: 200, description: 'Email verified successfully', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async verifyEmail(@Param('id') id: string): Promise<User> {
    return this.usersService.verifyEmail(id);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  async resetPassword(
    @Param('id') id: string,
    @Body() body: { token: string; newPassword: string },
  ): Promise<void> {
    return this.usersService.resetPassword(body.token, body.newPassword);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @Request() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ): Promise<{ message: string }> {
    return this.usersService.changePassword(req.user.id, body.currentPassword, body.newPassword);
  }
} 