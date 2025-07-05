import { IsNumber, IsNotEmpty, Min, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWithdrawalDto {
  @ApiProperty({ description: 'Withdrawal amount' })
  @IsNumber()
  @Min(100, { message: 'Minimum withdrawal amount is 100' })
  amount: number;

  @ApiProperty({ description: 'Currency', enum: ['naira', 'usdt'] })
  @IsEnum(['naira', 'usdt'])
  currency: 'naira' | 'usdt';

  @ApiPropertyOptional({ description: 'Additional notes for the withdrawal' })
  @IsOptional()
  notes?: string;
} 