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
import { ReferralsService } from './referrals.service';
import { CreateReferralDto } from './dto/create-referral.dto';
import { UpdateReferralDto } from './dto/update-referral.dto';
import { Referral } from './schemas/referral.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('referrals')
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new referral' })
  @ApiResponse({ status: 201, description: 'Referral created successfully', type: Referral })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'User already has a referral relationship' })
  async create(@Body() createReferralDto: CreateReferralDto): Promise<Referral> {
    return this.referralsService.create(createReferralDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all referrals (admin only)' })
  @ApiResponse({ status: 200, description: 'List of all referrals', type: [Referral] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(): Promise<Referral[]> {
    return this.referralsService.findAll();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user referrals' })
  @ApiResponse({ status: 200, description: 'User referrals retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyReferrals(@Request() req: any) {
    const referrals = await this.referralsService.getReferralsWithDetails(req.user.id);
    const stats = await this.referralsService.getReferralStats(req.user.id);
    
    return {
      success: true,
      data: referrals,
      stats: stats,
      total: referrals.length
    };
  }

  @Get('my/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user referral statistics' })
  @ApiResponse({ status: 200, description: 'Referral statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyReferralStats(@Request() req: any) {
    return this.referralsService.getReferralStats(req.user.id);
  }

  @Get('my/referral')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user referral info (who referred them)' })
  @ApiResponse({ status: 200, description: 'Referral info retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyReferralInfo(@Request() req: any) {
    const referral = await this.referralsService.findByReferredUser(req.user.id);
    return {
      success: true,
      data: referral
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get referral by ID' })
  @ApiResponse({ status: 200, description: 'Referral found', type: Referral })
  @ApiResponse({ status: 404, description: 'Referral not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string): Promise<Referral> {
    return this.referralsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update referral' })
  @ApiResponse({ status: 200, description: 'Referral updated successfully', type: Referral })
  @ApiResponse({ status: 404, description: 'Referral not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(@Param('id') id: string, @Body() updateReferralDto: UpdateReferralDto): Promise<Referral> {
    return this.referralsService.update(id, updateReferralDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete referral' })
  @ApiResponse({ status: 204, description: 'Referral deleted successfully' })
  @ApiResponse({ status: 404, description: 'Referral not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.referralsService.remove(id);
  }

  @Post(':id/mark-bonus-paid')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark referral bonus as paid' })
  @ApiResponse({ status: 200, description: 'Bonus marked as paid successfully', type: Referral })
  @ApiResponse({ status: 404, description: 'Referral not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markBonusAsPaid(
    @Param('id') id: string,
    @Body() body: { amount: number }
  ): Promise<Referral> {
    return this.referralsService.markBonusAsPaid(id, body.amount);
  }

  @Post(':id/mark-welcome-bonus-paid')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark welcome bonus as paid' })
  @ApiResponse({ status: 200, description: 'Welcome bonus marked as paid successfully', type: Referral })
  @ApiResponse({ status: 404, description: 'Referral not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markWelcomeBonusAsPaid(@Param('id') id: string): Promise<Referral> {
    return this.referralsService.markWelcomeBonusAsPaid(id);
  }

  @Post('update-stats/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update referral statistics for a user' })
  @ApiResponse({ status: 200, description: 'Statistics updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateReferralStats(@Param('userId') userId: string): Promise<void> {
    return this.referralsService.updateReferralStats(userId);
  }
} 