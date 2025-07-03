import { IsString, IsNotEmpty, IsNumber, Min, Max, IsEnum, IsOptional, IsBoolean, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { InvestmentType } from '../schemas/investment.schema';

export class CreateInvestmentDto {
  @ApiProperty({ description: 'Investment plan ID' })
  @IsMongoId()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({ description: 'Investment amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Investment currency', enum: ['naira', 'usdt'] })
  @IsString()
  @IsNotEmpty()
  currency: 'naira' | 'usdt';

  @ApiProperty({ description: 'Daily ROI percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  dailyRoi: number;

  @ApiProperty({ description: 'Total ROI percentage' })
  @IsNumber()
  @Min(0)
  @Max(1000)
  totalRoi: number;

  @ApiProperty({ description: 'Investment duration in days' })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({ description: 'Investment start date' })
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({ description: 'Investment end date' })
  @IsNotEmpty()
  endDate: Date;

  @ApiProperty({ description: 'Total expected return' })
  @IsNumber()
  @Min(0)
  expectedReturn: number;

  @ApiProperty({ description: 'Investment type', enum: InvestmentType })
  @IsEnum(InvestmentType)
  @IsOptional()
  type?: InvestmentType;

  @ApiProperty({ description: 'Auto-reinvest enabled' })
  @IsBoolean()
  @IsOptional()
  autoReinvest?: boolean;

  @ApiProperty({ description: 'Next ROI update timestamp' })
  @IsNotEmpty()
  nextRoiUpdate: Date;

  @ApiProperty({ description: 'Welcome bonus amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  welcomeBonus?: number;

  @ApiProperty({ description: 'Referral bonus amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  referralBonus?: number;

  @ApiProperty({ description: 'Transaction ID for the investment' })
  @IsMongoId()
  @IsOptional()
  transactionId?: string;

  @ApiProperty({ description: 'Investment notes' })
  @IsString()
  @IsOptional()
  notes?: string;
} 