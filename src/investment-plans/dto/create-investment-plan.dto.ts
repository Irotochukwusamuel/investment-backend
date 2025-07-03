import { IsString, IsNotEmpty, IsNumber, Min, Max, IsEnum, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvestmentPlanStatus } from '../schemas/investment-plan.schema';

export class CreateInvestmentPlanDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ['naira', 'usdt'] })
  @IsString()
  @IsNotEmpty()
  currency: 'naira' | 'usdt';

  @ApiProperty()
  @IsNumber()
  @Min(0)
  minAmount: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  maxAmount: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  dailyRoi: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(1000)
  totalRoi: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  welcomeBonus?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  referralBonus?: number;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  popularity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalInvestors?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalVolume?: number;

  @ApiProperty({ enum: InvestmentPlanStatus, default: InvestmentPlanStatus.ACTIVE })
  @IsEnum(InvestmentPlanStatus)
  @IsOptional()
  status?: InvestmentPlanStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  autoReinvestEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  earlyWithdrawalPenalty?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minWithdrawalAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxWithdrawalAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  withdrawalProcessingTime?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  currentTotalInvestment?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxTotalInvestment?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;
} 