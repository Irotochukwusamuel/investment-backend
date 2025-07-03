import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus } from '../schemas/transaction.schema';

export class ProcessTransactionDto {
  @ApiProperty({ description: 'Transaction status', enum: TransactionStatus })
  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @ApiProperty({ description: 'Reason for status change', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
} 