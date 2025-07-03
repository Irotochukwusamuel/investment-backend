import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WalletType } from '../schemas/wallet.schema';

export class CreateWalletDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Wallet type', enum: WalletType })
  @IsEnum(WalletType)
  type: WalletType;

  @ApiProperty({ description: 'Initial naira balance', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  nairaBalance?: number;

  @ApiProperty({ description: 'Initial USDT balance', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  usdtBalance?: number;
} 