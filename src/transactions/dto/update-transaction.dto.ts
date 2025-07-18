import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateTransactionDto } from './create-transaction.dto';
import { IsEnum, IsOptional, IsString, IsDate, IsObject, IsNumber } from 'class-validator';
import { TransactionStatus } from '../schemas/transaction.schema';

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {
  @ApiProperty({ description: 'Transaction status', enum: TransactionStatus, required: false })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiProperty({ description: 'External reference from payment provider', required: false })
  @IsString()
  @IsOptional()
  externalReference?: string;

  @ApiProperty({ description: 'Processing date', required: false })
  @IsDate()
  @IsOptional()
  processedAt?: Date;

  @ApiProperty({ description: 'Failed date', required: false })
  @IsDate()
  @IsOptional()
  failedAt?: Date;

  @ApiProperty({ description: 'Failure reason', required: false })
  @IsString()
  @IsOptional()
  failureReason?: string;

  @ApiProperty({ description: 'Transaction fee', required: false })
  @IsNumber()
  @IsOptional()
  fee?: number;

  @ApiProperty({ description: 'Net transaction amount', required: false })
  @IsNumber()
  @IsOptional()
  netAmount?: number;

  @ApiProperty({ description: 'Transaction metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
} 