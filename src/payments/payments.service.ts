import { Injectable, Logger, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { VirtualWallet, VirtualWalletDocument, VirtualWalletStatus } from './schemas/virtual-wallet.schema';
import { CreateVirtualWalletDto } from './dto/create-virtual-wallet.dto';
import { WalletService } from '../wallet/wallet.service';
import { WalletType } from '../wallet/schemas/wallet.schema';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType, TransactionStatus } from '../transactions/schemas/transaction.schema';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationCategory } from '../notifications/schemas/notification.schema';
import { EmailService } from '../email/email.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

interface FintavaVirtualWalletResponse {
  data: {
    id: string;
    customerName: string;
    merchantReference: string;
    expireTimeInMin: number;
    description: string;
    metadata: any;
    amount: string;
    phone: string;
    email: string;
    bank: string;
    virtualAcctName: string;
    virtualAcctNo: string;
    requestTime: string;
    status: string;
    paymentStatus: string;
  };
  status: number;
  message: string;
}

interface FintavaWebhookData {
  event: string;
  data: {
    id: string;
    customerName: string;
    merchantReference: string;
    expireTimeInMin: number;
    description: string;
    metadata: any;
    amount: string;
    phone: string;
    email: string;
    bank: string;
    virtualAcctName: string;
    virtualAcctNo: string;
    requestTime: string;
    status: string;
    paymentStatus: string;
  };
}

interface FintavaBankListResponse {
  status: number;
  message: string;
  data: Array<{
    id: string;
    name: string;
    code: string;
    sortCode: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface FintavaAccountDetailsResponse {
  status: number;
  message: string;
  data: {
    accountNumber: string;
    accountName: string;
    bankCode: string;
    bankName: string;
  };
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly fintavaClient: AxiosInstance;
  private readonly baseUrl: string;
  private readonly webhookUrl: string;

  constructor(
    @InjectModel(VirtualWallet.name) private virtualWalletModel: Model<VirtualWalletDocument>,
    private readonly configService: ConfigService,
    private readonly walletService: WalletService,
    private readonly transactionsService: TransactionsService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {
    const apiKey = this.configService.get<string>('FINTAVA_API_KEY');
    this.baseUrl = this.configService.get<string>('FINTAVA_BASE_URL', 'https://dev.fintavapay.com/api/dev');
    this.webhookUrl = this.configService.get<string>('FINTAVA_WEBHOOK_URL', 'http://localhost:3001/api/v1/payments/webhook/fintava');
    
    if (!apiKey) {
      this.logger.error('FINTAVA_API_KEY not found in environment variables');
      throw new Error('FINTAVA_API_KEY is required');
    }

    this.fintavaClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });

    // Add request interceptor for logging
    this.fintavaClient.interceptors.request.use(
      (config) => {
        this.logger.debug(`Making request to FINTAVA: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('FINTAVA request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.fintavaClient.interceptors.response.use(
      (response) => {
        this.logger.debug(`FINTAVA response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        this.logger.error('FINTAVA response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  async createVirtualWallet(userId: string, createDto: CreateVirtualWalletDto): Promise<VirtualWallet> {
    try {
      // Fetch user data from database
      const user = await this.usersService.findById(userId);
      
      // Auto-populate user details with fallbacks
      const customerName = createDto.customerName || `${user.firstName} ${user.lastName}`;
      const email = createDto.email || user.email;
      const phone = createDto.phone || user.phoneNumber || '';
      
      // Validate required fields
      if (!email) {
        throw new BadRequestException('User email is required but not found in profile');
      }
      
      if (!phone) {
        throw new BadRequestException('User phone number is required but not found in profile. Please update your profile.');
      }
      
      // Generate unique merchant reference if not provided
      const merchantReference = createDto.merchantReference || `KLTMINES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Set default values
      const description = createDto.description || 'Wallet funding';
      const expireTimeInMin = createDto.expireTimeInMin || 30;
      
      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expireTimeInMin);

      // Create virtual wallet request payload
      const payload = {
        customerName,
        email,
        phone,
        amount: createDto.amount,
        merchantReference,
        description,
        expireTimeInMin,
        metadata: createDto.metadata || {},
      };

      this.logger.debug('Creating virtual wallet with payload:', payload);

      // Make request to FINTAVA API
      const response = await this.fintavaClient.post<FintavaVirtualWalletResponse>('/virtual-wallet/generate', payload);

      if (response.data.status !== 200) {
        throw new BadRequestException(`FINTAVA API error: ${response.data.message}`);
      }

      const fintavaData = response.data.data;

      // Create virtual wallet record in database
      const virtualWallet = new this.virtualWalletModel({
        userId: new Types.ObjectId(userId),
        customerName,
        email,
        phone,
        amount: createDto.amount,
        merchantReference,
        description,
        expireTimeInMin,
        expiresAt,
        status: VirtualWalletStatus.ACTIVE,
        fintavaId: fintavaData.id,
        bank: fintavaData.bank,
        virtualAcctName: fintavaData.virtualAcctName,
        virtualAcctNo: fintavaData.virtualAcctNo,
        paymentStatus: fintavaData.paymentStatus,
        requestTime: new Date(fintavaData.requestTime),
        metadata: createDto.metadata,
      });

      const savedWallet = await virtualWallet.save();

      // Create pending transaction record
      await this.transactionsService.create({
        userId,
        type: TransactionType.DEPOSIT,
        amount: createDto.amount,
        currency: 'naira',
        description,
        status: TransactionStatus.PENDING,
        reference: merchantReference,
        paymentMethod: 'fintava_virtual_wallet',
        externalReference: fintavaData.id,
        paymentDetails: {
          bank: fintavaData.bank,
          accountName: fintavaData.virtualAcctName,
          accountNumber: fintavaData.virtualAcctNo,
          expiresAt: expiresAt.toISOString(),
        },
      });

      // Create notification
      await this.notificationsService.createTransactionNotification(
        userId,
        'Virtual Wallet Created',
        `Your virtual wallet for ₦${createDto.amount.toLocaleString()} deposit has been created. Please complete payment within ${expireTimeInMin} minutes.`,
        NotificationType.INFO
      );

      this.logger.log(`Virtual wallet created successfully for user ${userId}: ${savedWallet._id}`);

      return savedWallet;
    } catch (error) {
      this.logger.error('Error creating virtual wallet:', error);
      
      if (error.response?.data) {
        throw new BadRequestException(`FINTAVA API error: ${error.response.data.message || 'Unknown error'}`);
      }
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to create virtual wallet');
    }
  }

  async handleWebhook(webhookData: FintavaWebhookData): Promise<void> {
    try {
      this.logger.debug('Processing FINTAVA webhook:', webhookData);

      if (webhookData.event !== 'VIRTUAL_WALLET_PAYMENT') {
        this.logger.warn(`Unhandled webhook event: ${webhookData.event}`);
        return;
      }

      const { data } = webhookData;

      // Find virtual wallet by merchant reference
      const virtualWallet = await this.virtualWalletModel.findOne({
        merchantReference: data.merchantReference,
      });

      if (!virtualWallet) {
        this.logger.error(`Virtual wallet not found for reference: ${data.merchantReference}`);
        throw new NotFoundException('Virtual wallet not found');
      }

      // Check if payment is already processed
      if (virtualWallet.status === VirtualWalletStatus.PAID) {
        this.logger.warn(`Payment already processed for reference: ${data.merchantReference}`);
        return;
      }

      // Update virtual wallet status
      virtualWallet.status = VirtualWalletStatus.PAID;
      virtualWallet.paymentStatus = data.paymentStatus;
      virtualWallet.paymentTime = new Date();
      virtualWallet.webhookData = data;
      await virtualWallet.save();

      // Update transaction status
      await this.transactionsService.updateByReference(data.merchantReference, {
        status: TransactionStatus.SUCCESS,
        processedAt: new Date(),
        externalReference: data.id,
      });

      // Credit user wallet
      await this.walletService.deposit(virtualWallet.userId.toString(), {
        walletType: WalletType.MAIN,
        amount: parseFloat(data.amount),
        currency: 'naira',
        description: data.description,
        paymentReference: data.merchantReference,
      });

      // Get user details for notifications
      const user = await this.usersService.findById(virtualWallet.userId.toString());
      
      if (user) {
        // Create success notification
        await this.notificationsService.createTransactionNotification(
          virtualWallet.userId.toString(),
          'Deposit Successful',
          `Your deposit of ₦${parseFloat(data.amount).toLocaleString()} has been processed successfully and credited to your wallet.`,
          NotificationType.SUCCESS
        );

        // Send deposit confirmation email
        try {
          await this.emailService.sendDepositConfirmedEmail(
            user.email,
            user.firstName || user.email,
            {
              amount: parseFloat(data.amount),
              currency: 'naira',
              paymentMethod: 'Bank Transfer (FINTAVA)',
              reference: data.merchantReference,
              confirmationDate: new Date(),
              transactionHash: data.id,
            }
          );
        } catch (emailError) {
          this.logger.error('Failed to send deposit confirmation email:', emailError);
        }
      }

      // Emit real-time event to user
      this.realtimeGateway.emitToUser(
        virtualWallet.userId.toString(),
        'wallet:depositConfirmed',
        {
          amount: parseFloat(data.amount),
          currency: 'naira',
          reference: data.merchantReference,
          description: data.description,
          paymentMethod: 'Bank Transfer (FINTAVA)',
          time: new Date(),
        }
      );

      this.logger.log(`Successfully processed payment for reference: ${data.merchantReference}`);
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      throw error;
    }
  }

  async getVirtualWallet(id: string): Promise<VirtualWallet> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid virtual wallet ID');
    }

    const virtualWallet = await this.virtualWalletModel.findById(id).exec();
    
    if (!virtualWallet) {
      throw new NotFoundException('Virtual wallet not found');
    }

    return virtualWallet;
  }

  async getVirtualWalletByReference(merchantReference: string): Promise<VirtualWallet> {
    const virtualWallet = await this.virtualWalletModel.findOne({ merchantReference }).exec();
    
    if (!virtualWallet) {
      throw new NotFoundException('Virtual wallet not found');
    }

    return virtualWallet;
  }

  async getUserVirtualWallets(userId: string, options?: { limit?: number; page?: number }): Promise<{
    wallets: VirtualWallet[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { limit = 10, page = 1 } = options || {};
    const skip = (page - 1) * limit;

    const [wallets, total] = await Promise.all([
      this.virtualWalletModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.virtualWalletModel.countDocuments({ userId: new Types.ObjectId(userId) }),
    ]);

    return {
      wallets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async cancelVirtualWallet(id: string, userId: string): Promise<VirtualWallet> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid virtual wallet ID');
    }

    const virtualWallet = await this.virtualWalletModel.findOne({
      _id: id,
      userId: new Types.ObjectId(userId),
    });

    if (!virtualWallet) {
      throw new NotFoundException('Virtual wallet not found');
    }

    if (virtualWallet.status === VirtualWalletStatus.PAID) {
      throw new BadRequestException('Cannot cancel a paid virtual wallet');
    }

    virtualWallet.status = VirtualWalletStatus.CANCELLED;
    await virtualWallet.save();

    // Update transaction status
    await this.transactionsService.updateByReference(virtualWallet.merchantReference, {
      status: TransactionStatus.CANCELLED,
    });

    return virtualWallet;
  }

  async cleanupExpiredWallets(): Promise<void> {
    try {
      const expiredWallets = await this.virtualWalletModel.find({
        status: { $in: [VirtualWalletStatus.PENDING, VirtualWalletStatus.ACTIVE] },
        expiresAt: { $lt: new Date() },
      });

      for (const wallet of expiredWallets) {
        wallet.status = VirtualWalletStatus.EXPIRED;
        await wallet.save();

        // Update transaction status
        await this.transactionsService.updateByReference(wallet.merchantReference, {
          status: TransactionStatus.CANCELLED,
        });
      }

      if (expiredWallets.length > 0) {
        this.logger.log(`Cleaned up ${expiredWallets.length} expired virtual wallets`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up expired wallets:', error);
    }
  }

  /**
   * Get the webhook URL for FINTAVA configuration
   */
  getWebhookUrl(): string {
    return this.webhookUrl;
  }

  /**
   * Get list of banks supported by FINTAVA
   */
  async getBankList(): Promise<FintavaBankListResponse['data']> {
    try {
      this.logger.debug('Fetching bank list from FINTAVA');

      const response = await this.fintavaClient.get<FintavaBankListResponse>('/banks');

      if (response.data.status !== 200) {
        throw new BadRequestException(`FINTAVA API error: ${response.data.message}`);
      }

      this.logger.log('Successfully fetched bank list from FINTAVA');
      return response.data.data;
    } catch (error) {
      this.logger.error('Error fetching bank list:', error);
      
      if (error.response?.data) {
        throw new BadRequestException(`FINTAVA API error: ${error.response.data.message || 'Unknown error'}`);
      }
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to fetch bank list');
    }
  }

  /**
   * Verify account details using FINTAVA API
   */
  async verifyAccountDetails(accountNumber: string, sortCode: string): Promise<FintavaAccountDetailsResponse['data']> {
    try {
      this.logger.debug(`Verifying account details for account: ${accountNumber}`);

      const response = await this.fintavaClient.get<FintavaAccountDetailsResponse>(
        `/name/enquiry?accountNumber=${accountNumber}&sortCode=${sortCode}`
      );

      if (response.data.status !== 200) {
        throw new BadRequestException(`FINTAVA API error: ${response.data.message}`);
      }

      this.logger.log(`Successfully verified account details for account: ${accountNumber}`);
      return response.data.data;
    } catch (error) {
      this.logger.error('Error verifying account details:', error);
      
      if (error.response?.data) {
        throw new BadRequestException(`FINTAVA API error: ${error.response.data.message || 'Unknown error'}`);
      }
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to verify account details');
    }
  }
} 