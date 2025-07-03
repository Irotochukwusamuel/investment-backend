import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateWalletDto } from './create-wallet.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateWalletDto extends PartialType(CreateWalletDto) {
  @ApiProperty({ description: 'Wallet status', enum: ['active', 'suspended', 'locked'], required: false })
  @IsEnum(['active', 'suspended', 'locked'])
  @IsOptional()
  status?: 'active' | 'suspended' | 'locked';
} 