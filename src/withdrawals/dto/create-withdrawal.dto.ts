import { IsNumber, IsNotEmpty, Min, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWithdrawalDto {
  @ApiProperty({ description: 'Withdrawal amount' })
  @IsNumber()
  @Min(1, { message: 'Withdrawal amount must be at least 1' })
  amount: number;

  @ApiProperty({ description: 'Currency', enum: ['naira', 'usdt'] })
  @IsEnum(['naira', 'usdt'])
  currency: 'naira' | 'usdt';

  @ApiPropertyOptional({ description: 'Withdrawal method', enum: ['bank_transfer', 'crypto'] })
  @IsOptional()
  @IsEnum(['bank_transfer', 'crypto'])
  withdrawalMethod?: 'bank_transfer' | 'crypto';

  @ApiPropertyOptional({ description: 'Additional notes for the withdrawal' })
  @IsOptional()
  notes?: string;
} 