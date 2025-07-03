import { IsString, IsNotEmpty, IsNumber, Min, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WalletType } from '../schemas/wallet.schema';

export class TransferDto {
  @ApiProperty({ description: 'Source wallet type', enum: WalletType })
  @IsEnum(WalletType)
  fromWallet: WalletType;

  @ApiProperty({ description: 'Destination wallet type', enum: WalletType })
  @IsEnum(WalletType)
  toWallet: WalletType;

  @ApiProperty({ description: 'Transfer amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Currency', enum: ['naira', 'usdt'] })
  @IsEnum(['naira', 'usdt'])
  currency: 'naira' | 'usdt';

  @ApiProperty({ description: 'Transfer description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
} 