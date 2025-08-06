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
    
    // Always use main wallet for all deposits
    let wallet: WalletDocument | null = await this.walletModel.findOne({
      userId: new Types.ObjectId(userId),
      type: WalletType.MAIN,
    });

    if (!wallet) {
      // Create main wallet if it doesn't exist
      wallet = await this.create({
        userId,
        type: WalletType.MAIN,
        nairaBalance: currency === 'naira' ? amount : 0,
        usdtBalance: currency === 'usdt' ? amount : 0,
      });
    } else {
      // Update existing main wallet
      if (currency === 'naira') {
        wallet.nairaBalance += amount;
        wallet.totalDeposits += amount;
      } else {
        wallet.usdtBalance += amount;
        wallet.totalDeposits += amount;
      }
      
      // Track different types of earnings based on description
      if (description) {
        const desc = description.toLowerCase();
        if (desc.includes('roi') || desc.includes('profit') || desc.includes('earnings')) {
          wallet.totalEarnings += amount;
        } else if (desc.includes('bonus') || desc.includes('reward')) {
          wallet.totalBonuses += amount;
        } else if (desc.includes('referral') || desc.includes('ref')) {
          wallet.totalReferralEarnings += amount;
        }
      }
      
      wallet.lastTransactionDate = new Date();
      await wallet.save();
    }

    return wallet as WalletDocument;
  }

  // New method to handle bonus deposits that go to locked balance
  async depositBonus(userId: string, depositDto: DepositDto): Promise<WalletDocument> {
    const { walletType, amount, currency, description } = depositDto;
    
    // Always use main wallet for all deposits
    let wallet: WalletDocument | null = await this.walletModel.findOne({
      userId: new Types.ObjectId(userId),
      type: WalletType.MAIN,
    });

    if (!wallet) {
      // Create main wallet if it doesn't exist
      wallet = await this.create({
        userId,
        type: WalletType.MAIN,
        nairaBalance: 0,
        usdtBalance: 0,
      });
    }

    // Determine bonus type based on description
    const isWelcomeBonus = description?.toLowerCase().includes('welcome');
    const isReferralBonus = description?.toLowerCase().includes('referral');

    // Add bonus to appropriate locked balance
    if (currency === 'naira') {
      wallet.lockedNairaBonuses += amount; // Keep total for backward compatibility
      
      if (isWelcomeBonus) {
        wallet.lockedNairaWelcomeBonuses += amount;
      } else if (isReferralBonus) {
        wallet.lockedNairaReferralBonuses += amount;
      }
    } else {
      wallet.lockedUsdtBonuses += amount; // Keep total for backward compatibility
      
      if (isWelcomeBonus) {
        wallet.lockedUsdtWelcomeBonuses += amount;
      } else if (isReferralBonus) {
        wallet.lockedUsdtReferralBonuses += amount;
      }
    }
    
    // Track bonus in total bonuses
    wallet.totalBonuses += amount;
    
    wallet.lastTransactionDate = new Date();
    await wallet.save();

    return wallet as WalletDocument;
  }

  // Method to unlock bonuses (move from locked to available)
  async unlockBonus(userId: string, amount: number, currency: 'naira' | 'usdt'): Promise<WalletDocument> {
    const wallet = await this.findByUserAndType(userId, WalletType.MAIN);

    if (currency === 'naira') {
      if (wallet.lockedNairaBonuses < amount) {
        throw new BadRequestException('Insufficient locked naira bonuses');
      }
      wallet.lockedNairaBonuses -= amount;
      wallet.nairaBalance += amount;
      
      // Also reduce the specific bonus types proportionally
      const totalLocked = wallet.lockedNairaWelcomeBonuses + wallet.lockedNairaReferralBonuses;
      if (totalLocked > 0) {
        const welcomeRatio = wallet.lockedNairaWelcomeBonuses / totalLocked;
        const referralRatio = wallet.lockedNairaReferralBonuses / totalLocked;
        
        wallet.lockedNairaWelcomeBonuses -= amount * welcomeRatio;
        wallet.lockedNairaReferralBonuses -= amount * referralRatio;
      }
    } else {
      if (wallet.lockedUsdtBonuses < amount) {
        throw new BadRequestException('Insufficient locked USDT bonuses');
      }
      wallet.lockedUsdtBonuses -= amount;
      wallet.usdtBalance += amount;
      
      // Also reduce the specific bonus types proportionally
      const totalLocked = wallet.lockedUsdtWelcomeBonuses + wallet.lockedUsdtReferralBonuses;
      if (totalLocked > 0) {
        const welcomeRatio = wallet.lockedUsdtWelcomeBonuses / totalLocked;
        const referralRatio = wallet.lockedUsdtReferralBonuses / totalLocked;
        
        wallet.lockedUsdtWelcomeBonuses -= amount * welcomeRatio;
        wallet.lockedUsdtReferralBonuses -= amount * referralRatio;
      }
    }

    wallet.lastTransactionDate = new Date();
    return wallet.save();
  }

  async withdraw(userId: string, withdrawalDto: WithdrawalDto): Promise<WalletDocument> {
    const { walletType, amount, currency, description } = withdrawalDto;
    
    // Always use main wallet for all withdrawals
    const wallet = await this.findByUserAndType(userId, WalletType.MAIN);

    // Check sufficient balance
    if (currency === 'naira' && wallet.nairaBalance < amount) {
      throw new BadRequestException('Insufficient naira balance');
    }
    if (currency === 'usdt' && wallet.usdtBalance < amount) {
      throw new BadRequestException('Insufficient USDT balance');
    }

    // Deduct from main wallet
    if (currency === 'naira') {
      wallet.nairaBalance -= amount;
      wallet.totalWithdrawals += amount;
    } else {
      wallet.usdtBalance -= amount;
      wallet.totalWithdrawals += amount;
    }

    wallet.lastTransactionDate = new Date();
    return wallet.save();
  }

  async transfer(userId: string, transferDto: TransferDto): Promise<{ fromWallet: WalletDocument; toWallet: WalletDocument }> {
    const { fromWallet, toWallet, amount, currency } = transferDto;
    
    // Since we only have one main wallet now, transfers are just internal tracking
    // Both fromWallet and toWallet will be the same main wallet
    const wallet = await this.findByUserAndType(userId, WalletType.MAIN);

    // For tracking purposes, we can log the transfer but no actual balance change
    // since it's within the same wallet
    wallet.lastTransactionDate = new Date();
    await wallet.save();

    return { fromWallet: wallet, toWallet: wallet };
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

  async getBonusDetails(userId: string): Promise<any> {
    const wallet = await this.findByUserAndType(userId, WalletType.MAIN);
    
    if (!wallet) {
      return {
        lockedWelcomeBonuses: { naira: 0, usdt: 0 },
        lockedReferralBonuses: { naira: 0, usdt: 0 },
        totalLockedBonuses: { naira: 0, usdt: 0 },
        availableBalance: { naira: 0, usdt: 0 },
        totalReferralEarnings: 0,
      };
    }

    return {
      lockedWelcomeBonuses: {
        naira: wallet.lockedNairaWelcomeBonuses || 0,
        usdt: wallet.lockedUsdtWelcomeBonuses || 0,
      },
      lockedReferralBonuses: {
        naira: wallet.lockedNairaReferralBonuses || 0,
        usdt: wallet.lockedUsdtReferralBonuses || 0,
      },
      totalLockedBonuses: {
        naira: wallet.lockedNairaBonuses || 0,
        usdt: wallet.lockedUsdtBonuses || 0,
      },
      availableBalance: {
        naira: wallet.nairaBalance || 0,
        usdt: wallet.usdtBalance || 0,
      },
      totalReferralEarnings: wallet.totalReferralEarnings || 0,
    };
  }

  async checkBalance(userId: string, amount: number, currency: 'naira' | 'usdt'): Promise<boolean> {
    try {
      const wallet = await this.findByUserAndType(userId, WalletType.MAIN);
      
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

  async getBalance(userId: string, currency: 'naira' | 'usdt'): Promise<number> {
    try {
      const wallet = await this.findByUserAndType(userId, WalletType.MAIN);
      
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
    // Create only one main wallet that handles all transactions
    const mainWallet = await this.create({
      userId,
      type: WalletType.MAIN,
      nairaBalance: 0,
      usdtBalance: 0,
    });

    return [mainWallet];
  }
} 