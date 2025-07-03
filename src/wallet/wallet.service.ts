import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument, WalletType } from './schemas/wallet.schema';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { TransferDto } from './dto/transfer.dto';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawalDto } from './dto/withdrawal.dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {}

  async create(createWalletDto: CreateWalletDto): Promise<WalletDocument> {
    const wallet = new this.walletModel({
      ...createWalletDto,
      userId: new Types.ObjectId(createWalletDto.userId),
    });
    return wallet.save();
  }

  async findAll(query: any = {}): Promise<WalletDocument[]> {
    const { userId, type, status, limit = 50, page = 1 } = query;
    const filter: any = {};
    if (userId) filter.userId = new Types.ObjectId(userId);
    if (type) filter.type = type;
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    return this.walletModel
      .find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async findOne(id: string): Promise<WalletDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid wallet ID');
    }
    const wallet = await this.walletModel
      .findById(id)
      .populate('userId', 'firstName lastName email')
      .exec();
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

  async findByUserId(userId: string): Promise<WalletDocument[]> {
    return this.walletModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('userId', 'firstName lastName email')
      .sort({ type: 1 })
      .exec();
  }

  async findByUserAndType(userId: string, type: WalletType): Promise<WalletDocument> {
    const wallet = await this.walletModel
      .findOne({ userId: new Types.ObjectId(userId), type })
      .populate('userId', 'firstName lastName email')
      .exec();
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

  async update(id: string, updateWalletDto: UpdateWalletDto): Promise<WalletDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid wallet ID');
    }
    const wallet = await this.walletModel
      .findByIdAndUpdate(id, updateWalletDto, { new: true, runValidators: true })
      .exec();
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid wallet ID');
    }
    const wallet = await this.walletModel.findByIdAndDelete(id).exec();
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
  }

  async deposit(userId: string, depositDto: DepositDto): Promise<WalletDocument> {
    const { walletType, amount, currency, description } = depositDto;
    
    let wallet: WalletDocument | null = await this.walletModel.findOne({
      userId: new Types.ObjectId(userId),
      type: walletType,
    });

    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = await this.create({
        userId,
        type: walletType,
        nairaBalance: currency === 'naira' ? amount : 0,
        usdtBalance: currency === 'usdt' ? amount : 0,
      });
    } else {
      // Update existing wallet
      if (currency === 'naira') {
        wallet.nairaBalance += amount;
        wallet.totalDeposits += amount;
      } else {
        wallet.usdtBalance += amount;
        wallet.totalDeposits += amount;
      }
      
      // Track earnings from ROI
      if (description && description.toLowerCase().includes('roi')) {
        wallet.totalEarnings += amount;
      }
      
      wallet.lastTransactionDate = new Date();
      await wallet.save();
    }

    return wallet as WalletDocument;
  }

  async withdraw(userId: string, withdrawalDto: WithdrawalDto): Promise<WalletDocument> {
    const { walletType, amount, currency, description } = withdrawalDto;
    
    const wallet = await this.findByUserAndType(userId, walletType);
    
    if (currency === 'naira' && wallet.nairaBalance < amount) {
      throw new BadRequestException('Insufficient naira balance');
    }
    if (currency === 'usdt' && wallet.usdtBalance < amount) {
      throw new BadRequestException('Insufficient USDT balance');
    }

    if (currency === 'naira') {
      wallet.nairaBalance -= amount;
      wallet.totalWithdrawals += amount;
    } else {
      wallet.usdtBalance -= amount;
      wallet.totalWithdrawals += amount;
    }

    // Track investment amounts
    if (description && description.toLowerCase().includes('investment')) {
      wallet.totalInvestments += amount;
    }
    
    wallet.lastTransactionDate = new Date();
    await wallet.save();
    return wallet;
  }

  async transfer(userId: string, transferDto: TransferDto): Promise<{ fromWallet: WalletDocument; toWallet: WalletDocument }> {
    const { fromWallet, toWallet, amount, currency } = transferDto;
    
    if (fromWallet === toWallet) {
      throw new BadRequestException('Cannot transfer to the same wallet');
    }

    const sourceWallet = await this.findByUserAndType(userId, fromWallet);
    const destinationWallet = await this.findByUserAndType(userId, toWallet);

    // Check sufficient balance
    if (currency === 'naira' && sourceWallet.nairaBalance < amount) {
      throw new BadRequestException('Insufficient naira balance');
    }
    if (currency === 'usdt' && sourceWallet.usdtBalance < amount) {
      throw new BadRequestException('Insufficient USDT balance');
    }

    // Deduct from source wallet
    if (currency === 'naira') {
      sourceWallet.nairaBalance -= amount;
    } else {
      sourceWallet.usdtBalance -= amount;
    }
    sourceWallet.lastTransactionDate = new Date();
    await sourceWallet.save();

    // Add to destination wallet
    if (currency === 'naira') {
      destinationWallet.nairaBalance += amount;
    } else {
      destinationWallet.usdtBalance += amount;
    }
    destinationWallet.lastTransactionDate = new Date();
    await destinationWallet.save();

    return { fromWallet: sourceWallet, toWallet: destinationWallet };
  }

  async getWalletStats(userId?: string): Promise<any> {
    const filter: any = {};
    if (userId) {
      filter.userId = new Types.ObjectId(userId);
    }

    const stats = await this.walletModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalWallets: { $sum: 1 },
          totalNairaBalance: { $sum: '$nairaBalance' },
          totalUsdtBalance: { $sum: '$usdtBalance' },
          totalDeposits: { $sum: '$totalDeposits' },
          totalWithdrawals: { $sum: '$totalWithdrawals' },
          totalInvestments: { $sum: '$totalInvestments' },
          totalEarnings: { $sum: '$totalEarnings' },
          totalBonuses: { $sum: '$totalBonuses' },
          totalReferralEarnings: { $sum: '$totalReferralEarnings' },
        }
      }
    ]);

    return stats[0] || {
      totalWallets: 0,
      totalNairaBalance: 0,
      totalUsdtBalance: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalInvestments: 0,
      totalEarnings: 0,
      totalBonuses: 0,
      totalReferralEarnings: 0,
    };
  }

  async checkBalance(userId: string, amount: number, currency: 'naira' | 'usdt', walletType: WalletType = WalletType.MAIN): Promise<boolean> {
    try {
      const wallet = await this.findByUserAndType(userId, walletType);
      
      if (currency === 'naira') {
        return wallet.nairaBalance >= amount;
      } else {
        return wallet.usdtBalance >= amount;
      }
    } catch (error) {
      // If wallet doesn't exist, balance is 0
      return false;
    }
  }

  async getBalance(userId: string, currency: 'naira' | 'usdt', walletType: WalletType = WalletType.MAIN): Promise<number> {
    try {
      const wallet = await this.findByUserAndType(userId, walletType);
      
      if (currency === 'naira') {
        return wallet.nairaBalance;
      } else {
        return wallet.usdtBalance;
      }
    } catch (error) {
      // If wallet doesn't exist, balance is 0
      return 0;
    }
  }

  async createDefaultWallets(userId: string): Promise<WalletDocument[]> {
    const wallets: WalletDocument[] = [];
    // Create main wallet
    const mainWallet = await this.create({
      userId,
      type: WalletType.MAIN,
      nairaBalance: 0,
      usdtBalance: 0,
    });
    wallets.push(mainWallet);

    // Create profit wallet
    const profitWallet = await this.create({
      userId,
      type: WalletType.PROFIT,
      nairaBalance: 0,
      usdtBalance: 0,
    });
    wallets.push(profitWallet);

    // Create bonus wallet
    const bonusWallet = await this.create({
      userId,
      type: WalletType.BONUS,
      nairaBalance: 0,
      usdtBalance: 0,
    });
    wallets.push(bonusWallet);

    return wallets;
  }
} 