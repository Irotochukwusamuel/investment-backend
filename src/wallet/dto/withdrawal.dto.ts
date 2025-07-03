import { IsString, IsNotEmpty, IsNumber, Min, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WalletType } from '../schemas/wallet.schema';

export class WithdrawalDto {
  @ApiProperty({ description: 'Wallet type', enum: WalletType })
  @IsEnum(WalletType)
  walletType: WalletType;

  @ApiProperty({ description: 'Withdrawal amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Currency', enum: ['naira', 'usdt'] })
  @IsEnum(['naira', 'usdt'])
  currency: 'naira' | 'usdt';

  @ApiProperty({ description: 'Withdrawal method', required: false })
  @IsString()
  @IsOptional()
  withdrawalMethod?: string;

  @ApiProperty({ description: 'Account details', required: false })
  @IsString()
  @IsOptional()
  accountDetails?: string;

  @ApiProperty({ description: 'Withdrawal description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
} 