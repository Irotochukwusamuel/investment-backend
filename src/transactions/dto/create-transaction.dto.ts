import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionType, TransactionStatus } from '../schemas/transaction.schema';

export class CreateTransactionDto {
  @ApiProperty({ description: 'User ID' })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Transaction type', enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ description: 'Transaction status', enum: TransactionStatus, required: false })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiProperty({ description: 'Transaction amount' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Transaction currency', enum: ['naira', 'usdt'] })
  @IsString()
  currency: 'naira' | 'usdt';

  @ApiProperty({ description: 'Reference or external ID', required: false })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiProperty({ description: 'Description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Related investment ID', required: false })
  @IsMongoId()
  @IsOptional()
  investmentId?: string;

  @ApiProperty({ description: 'Related plan ID', required: false })
  @IsMongoId()
  @IsOptional()
  planId?: string;
} 