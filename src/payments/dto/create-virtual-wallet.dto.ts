import { IsString, IsNotEmpty, IsNumber, Min, IsEmail, IsPhoneNumber, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVirtualWalletDto {
  @ApiPropertyOptional({ description: 'Customer full name (auto-populated from user profile)' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Customer email address (auto-populated from user profile)' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Customer phone number (auto-populated from user profile)' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Amount to deposit' })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiPropertyOptional({ description: 'Merchant reference for the transaction (auto-generated if not provided)' })
  @IsOptional()
  @IsString()
  merchantReference?: string;

  @ApiProperty({ description: 'Description of the transaction', default: 'Wallet funding' })
  @IsOptional()
  @IsString()
  description?: string;

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