import { Model } from 'mongoose';
import { WalletDocument, WalletType } from './schemas/wallet.schema';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { TransferDto } from './dto/transfer.dto';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawalDto } from './dto/withdrawal.dto';
export declare class WalletService {
    private walletModel;
    constructor(walletModel: Model<WalletDocument>);
    create(createWalletDto: CreateWalletDto): Promise<WalletDocument>;
    findAll(query?: any): Promise<WalletDocument[]>;
    findOne(id: string): Promise<WalletDocument>;
    findByUserId(userId: string): Promise<WalletDocument[]>;
    findByUserAndType(userId: string, type: WalletType): Promise<WalletDocument>;
    update(id: string, updateWalletDto: UpdateWalletDto): Promise<WalletDocument>;
    remove(id: string): Promise<void>;
    deposit(userId: string, depositDto: DepositDto): Promise<WalletDocument>;
    withdraw(userId: string, withdrawalDto: WithdrawalDto): Promise<WalletDocument>;
    transfer(userId: string, transferDto: TransferDto): Promise<{
        fromWallet: WalletDocument;
        toWallet: WalletDocument;
    }>;
    getWalletStats(userId?: string): Promise<any>;
    checkBalance(userId: string, amount: number, currency: 'naira' | 'usdt', walletType?: WalletType): Promise<boolean>;
    getBalance(userId: string, currency: 'naira' | 'usdt', walletType?: WalletType): Promise<number>;
    createDefaultWallets(userId: string): Promise<WalletDocument[]>;
}
