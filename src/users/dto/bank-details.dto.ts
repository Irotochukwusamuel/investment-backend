import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBankDetailsDto {
  @ApiProperty({ description: 'Bank name' })
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiProperty({ description: 'Bank code' })
  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @ApiProperty({ description: 'Bank sort code' })
  @IsString()
  @IsNotEmpty()
  sortCode: string;

  @ApiProperty({ description: 'Account number' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ description: 'Account name' })
  @IsString()
  @IsNotEmpty()
  accountName: string;
}

export class UpdateBankDetailsDto {
  @ApiPropertyOptional({ description: 'Bank name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Bank code' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  bankCode?: string;

  @ApiPropertyOptional({ description: 'Bank sort code' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sortCode?: string;

  @ApiPropertyOptional({ description: 'Account number' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'Account name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  accountName?: string;

  @ApiPropertyOptional({ description: 'Whether the bank details are active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
} 