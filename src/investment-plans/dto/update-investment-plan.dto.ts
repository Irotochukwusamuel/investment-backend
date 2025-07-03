import { IsString, IsNumber, IsEnum, IsArray, IsOptional, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateInvestmentPlanDto } from './create-investment-plan.dto';

export class UpdateInvestmentPlanDto extends PartialType(CreateInvestmentPlanDto) {
  @ApiProperty({ description: 'Plan name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Plan description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Currency type', enum: ['naira', 'usdt'], required: false })
  @IsOptional()
  @IsEnum(['naira', 'usdt'])
  currency?: 'naira' | 'usdt';

  @ApiProperty({ description: 'Minimum investment amount', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiProperty({ description: 'Maximum investment amount', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiProperty({ description: 'Daily ROI percentage', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  dailyRoi?: number;

  @ApiProperty({ description: 'Total ROI percentage', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  totalRoi?: number;

  @ApiProperty({ description: 'Investment duration in days', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiProperty({ description: 'Welcome bonus percentage', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  welcomeBonus?: number;

  @ApiProperty({ description: 'Referral bonus percentage', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  referralBonus?: number;

  @ApiProperty({ description: 'Plan features', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({ description: 'Plan icon URL', required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ description: 'Sort order', required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiProperty({ description: 'Is plan active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Is plan popular', required: false })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @ApiProperty({ description: 'Is plan recommended', required: false })
  @IsOptional()
  @IsBoolean()
  isRecommended?: boolean;
} 