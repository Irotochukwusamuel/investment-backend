import { Controller, Post, Get, Body, Param, Delete, Query, UseGuards, Req, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateVirtualWalletDto } from './dto/create-virtual-wallet.dto';
import { CreateSimpleVirtualWalletDto } from './dto/create-simple-virtual-wallet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('virtual-wallet')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create virtual wallet for NGN deposit' })
  @ApiResponse({ status: 201, description: 'Virtual wallet created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createVirtualWallet(
    @GetUser() user: any,
    @Body() createDto: CreateVirtualWalletDto,
  ) {
    const virtualWallet = await this.paymentsService.createVirtualWallet(user.id, createDto);
    return {
      success: true,
      message: 'Virtual wallet created successfully',
      data: virtualWallet,
    };
  }

  @Post('virtual-wallet/simple')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create virtual wallet with user data auto-populated' })
  @ApiResponse({ status: 201, description: 'Virtual wallet created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - check if phone number is in user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createSimpleVirtualWallet(
    @GetUser() user: any,
    @Body() createDto: CreateSimpleVirtualWalletDto,
  ) {
    // Convert simple DTO to full DTO with auto-populated fields
    const fullDto: CreateVirtualWalletDto = {
      amount: createDto.amount,
      expireTimeInMin: createDto.expireTimeInMin || 30,
      metadata: createDto.metadata,
      // These will be auto-populated in the service
      customerName: undefined,
      email: undefined,
      phone: undefined,
      merchantReference: undefined,
      description: undefined,
    };

    const virtualWallet = await this.paymentsService.createVirtualWallet(user.id, fullDto);
    return {
      success: true,
      message: 'Virtual wallet created successfully',
      data: virtualWallet,
    };
  }

  @Get('virtual-wallets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user virtual wallets' })
  @ApiResponse({ status: 200, description: 'Virtual wallets retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserVirtualWallets(
    @GetUser() user: any,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    const result = await this.paymentsService.getUserVirtualWallets(user.id, { limit, page });
    return {
      success: true,
      message: 'Virtual wallets retrieved successfully',
      data: result,
    };
  }

  @Get('virtual-wallet/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get virtual wallet by ID' })
  @ApiResponse({ status: 200, description: 'Virtual wallet retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Virtual wallet not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getVirtualWallet(@Param('id') id: string) {
    const virtualWallet = await this.paymentsService.getVirtualWallet(id);
    return {
      success: true,
      message: 'Virtual wallet retrieved successfully',
      data: virtualWallet,
    };
  }

  @Delete('virtual-wallet/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel virtual wallet' })
  @ApiResponse({ status: 200, description: 'Virtual wallet cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Virtual wallet not found' })
  @ApiResponse({ status: 400, description: 'Cannot cancel paid virtual wallet' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancelVirtualWallet(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    const virtualWallet = await this.paymentsService.cancelVirtualWallet(id, user.id);
    return {
      success: true,
      message: 'Virtual wallet cancelled successfully',
      data: virtualWallet,
    };
  }

  @Post('webhook/fintava')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle FINTAVA webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  async handleFintavaWebhook(@Body() webhookData: any, @Req() request: Request) {
    try {
      this.logger.log('Received FINTAVA webhook:', JSON.stringify(webhookData, null, 2));
      
      // Validate webhook data structure
      if (!webhookData.event || !webhookData.data) {
        this.logger.error('Invalid webhook data structure');
        return { success: false, message: 'Invalid webhook data' };
      }

      // Process the webhook
      await this.paymentsService.handleWebhook(webhookData);
      
      this.logger.log('Webhook processed successfully');
      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      return { success: false, message: 'Error processing webhook' };
    }
  }

  @Post('test-virtual-wallet')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create test virtual wallet with user data auto-populated (DEPRECATED - use /virtual-wallet/simple instead)' })
  @ApiResponse({ status: 201, description: 'Test virtual wallet created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createTestVirtualWallet(
    @GetUser() user: any,
    @Body() body: { amount: number; expireTimeInMin?: number },
  ) {
    // This endpoint is deprecated, redirect to the new simple endpoint
    const createDto: CreateSimpleVirtualWalletDto = {
      amount: body.amount,
      expireTimeInMin: body.expireTimeInMin || 30,
    };

    return this.createSimpleVirtualWallet(user, createDto);
  }

  @Get('webhook-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get FINTAVA webhook URL for configuration' })
  @ApiResponse({ status: 200, description: 'Webhook URL retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWebhookUrl() {
    const webhookUrl = this.paymentsService.getWebhookUrl();
    return {
      success: true,
      message: 'Webhook URL retrieved successfully',
      data: {
        webhookUrl,
        description: 'Use this URL in your FINTAVA dashboard webhook configuration',
        endpoint: '/api/v1/payments/webhook/fintava',
      },
    };
  }

  @Get('banks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of banks supported by FINTAVA' })
  @ApiResponse({ status: 200, description: 'Bank list retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBankList() {
    const banks = await this.paymentsService.getBankList();
    return {
      success: true,
      message: 'Bank list retrieved successfully',
      data: banks,
    };
  }

  @Get('verify-account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify bank account details' })
  @ApiResponse({ status: 200, description: 'Account details verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid account details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async verifyAccountDetails(
    @Query('accountNumber') accountNumber: string,
    @Query('sortCode') sortCode: string,
  ) {
    if (!accountNumber || !sortCode) {
      return {
        success: false,
        message: 'Account number and sort code are required',
        data: null,
      };
    }

    const accountDetails = await this.paymentsService.verifyAccountDetails(accountNumber, sortCode);
    return {
      success: true,
      message: 'Account details verified successfully',
      data: accountDetails,
    };
  }
} 