import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateTransactionDto } from './create-transaction.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { TransactionStatus } from '../schemas/transaction.schema';

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {
  @ApiProperty({ description: 'Transaction status', enum: TransactionStatus, required: false })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;
} 