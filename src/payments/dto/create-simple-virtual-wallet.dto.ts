import { IsNumber, Min, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSimpleVirtualWalletDto {
  @ApiProperty({ description: 'Amount to deposit' })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty({ description: 'Expiration time in minutes', default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  expireTimeInMin?: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
} 