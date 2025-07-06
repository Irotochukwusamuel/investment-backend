import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReferralDto {
  @ApiProperty({ description: 'Referrer user ID' })
  @IsString()
  @IsNotEmpty()
  referrerId: string;

  @ApiProperty({ description: 'Referred user ID' })
  @IsString()
  @IsNotEmpty()
  referredUserId: string;

  @ApiProperty({ description: 'Referral code used' })
  @IsString()
  @IsNotEmpty()
  referralCode: string;

  @ApiProperty({ description: 'Whether the referral is active', default: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Total earnings from this referral', default: 0 })
  @IsOptional()
  @IsNumber()
  totalEarnings?: number;

  @ApiProperty({ description: 'Total investments made by referred user', default: 0 })
  @IsOptional()
  @IsNumber()
  totalInvestments?: number;

  @ApiProperty({ description: 'Referral bonus earned by referrer', default: 0 })
  @IsOptional()
  @IsNumber()
  referralBonus?: number;

  @ApiProperty({ description: 'Whether bonus has been paid', default: false })
  @IsOptional()
  @IsBoolean()
  bonusPaid?: boolean;

  @ApiProperty({ description: 'When bonus was paid' })
  @IsOptional()
  @IsDateString()
  bonusPaidAt?: Date;

  @ApiProperty({ description: 'Whether welcome bonus was paid', default: false })
  @IsOptional()
  @IsBoolean()
  welcomeBonusPaid?: boolean;

  @ApiProperty({ description: 'When welcome bonus was paid' })
  @IsOptional()
  @IsDateString()
  welcomeBonusPaidAt?: Date;

  @ApiProperty({ description: 'Referral status', default: 'pending' })
  @IsOptional()
  @IsString()
  status?: 'pending' | 'active' | 'inactive' | 'completed';

  @ApiProperty({ description: 'When referred user made first investment' })
  @IsOptional()
  @IsDateString()
  firstInvestmentAt?: Date;

  @ApiProperty({ description: 'Last activity from referred user' })
  @IsOptional()
  @IsDateString()
  lastActivityAt?: Date;

  @ApiProperty({ description: 'Additional notes about the referral' })
  @IsOptional()
  @IsString()
  notes?: string;
} 