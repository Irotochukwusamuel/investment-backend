import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsBoolean, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvestmentRequestDto {
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

  @ApiProperty({ description: 'Auto-reinvest enabled', required: false })
  @IsBoolean()
  @IsOptional()
  autoReinvest?: boolean;
} 