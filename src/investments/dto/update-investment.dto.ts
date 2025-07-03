import { IsString, IsNumber, IsEnum, IsOptional, Min, Max, IsBoolean, IsMongoId } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateInvestmentDto } from './create-investment.dto';
import { InvestmentStatus, InvestmentType } from '../schemas/investment.schema';

export class UpdateInvestmentDto extends PartialType(CreateInvestmentDto) {
  @ApiProperty({ description: 'Investment status', enum: InvestmentStatus, required: false })
  @IsEnum(InvestmentStatus)
  @IsOptional()
  status?: InvestmentStatus;

  @ApiProperty({ description: 'Current earned amount', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  earnedAmount?: number;

  @ApiProperty({ description: 'Last ROI update timestamp', required: false })
  @IsOptional()
  lastRoiUpdate?: Date;

  @ApiProperty({ description: 'Investment type', enum: InvestmentType, required: false })
  @IsEnum(InvestmentType)
  @IsOptional()
  type?: InvestmentType;

  @ApiProperty({ description: 'Auto-reinvest enabled', required: false })
  @IsBoolean()
  @IsOptional()
  autoReinvest?: boolean;

  @ApiProperty({ description: 'Welcome bonus amount', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  welcomeBonus?: number;

  @ApiProperty({ description: 'Referral bonus amount', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  referralBonus?: number;

  @ApiProperty({ description: 'Transaction ID for the investment', required: false })
  @IsMongoId()
  @IsOptional()
  transactionId?: string;

  @ApiProperty({ description: 'Investment notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
} 