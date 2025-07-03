import { IsString, IsNotEmpty, IsNumber, Min, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WalletType } from '../schemas/wallet.schema';

export class DepositDto {
  @ApiProperty({ description: 'Wallet type', enum: WalletType })
  @IsEnum(WalletType)
  walletType: WalletType;

  @ApiProperty({ description: 'Deposit amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Currency', enum: ['naira', 'usdt'] })
  @IsEnum(['naira', 'usdt'])
  currency: 'naira' | 'usdt';

  @ApiProperty({ description: 'Payment method', required: false })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({ description: 'Payment reference', required: false })
  @IsString()
  @IsOptional()
  paymentReference?: string;

  @ApiProperty({ description: 'Deposit description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
} 