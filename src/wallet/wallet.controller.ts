import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawalDto } from './dto/withdrawal.dto';
import { TransferDto } from './dto/transfer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  @ApiOperation({ summary: 'Create wallet' })
  create(@Body() createWalletDto: CreateWalletDto) {
    return this.walletService.create(createWalletDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all wallets' })
  findAll(@Query() query: any) {
    return this.walletService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get wallet stats' })
  getStats(@Query('userId') userId?: string) {
    return this.walletService.getWalletStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get wallet by ID' })
  findOne(@Param('id') id: string) {
    return this.walletService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update wallet' })
  update(@Param('id') id: string, @Body() updateWalletDto: UpdateWalletDto) {
    return this.walletService.update(id, updateWalletDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete wallet' })
  remove(@Param('id') id: string) {
    return this.walletService.remove(id);
  }

  @Post(':userId/deposit')
  @ApiOperation({ summary: 'Deposit to wallet' })
  deposit(@Param('userId') userId: string, @Body() depositDto: DepositDto) {
    return this.walletService.deposit(userId, depositDto);
  }

  @Post(':userId/withdraw')
  @ApiOperation({ summary: 'Withdraw from wallet' })
  withdraw(@Param('userId') userId: string, @Body() withdrawalDto: WithdrawalDto) {
    return this.walletService.withdraw(userId, withdrawalDto);
  }

  @Post(':userId/transfer')
  @ApiOperation({ summary: 'Transfer between wallets' })
  transfer(@Param('userId') userId: string, @Body() transferDto: TransferDto) {
    return this.walletService.transfer(userId, transferDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all wallets for a user' })
  findByUser(@Param('userId') userId: string) {
    return this.walletService.findByUserId(userId);
  }
} 