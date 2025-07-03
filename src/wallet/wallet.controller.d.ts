import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawalDto } from './dto/withdrawal.dto';
import { TransferDto } from './dto/transfer.dto';
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    create(createWalletDto: CreateWalletDto): Promise<import("./schemas/wallet.schema").WalletDocument>;
    findAll(query: any): Promise<import("./schemas/wallet.schema").WalletDocument[]>;
    getStats(userId?: string): Promise<any>;
    findOne(id: string): Promise<import("./schemas/wallet.schema").WalletDocument>;
    update(id: string, updateWalletDto: UpdateWalletDto): Promise<import("./schemas/wallet.schema").WalletDocument>;
    remove(id: string): Promise<void>;
    deposit(userId: string, depositDto: DepositDto): Promise<import("./schemas/wallet.schema").WalletDocument>;
    withdraw(userId: string, withdrawalDto: WithdrawalDto): Promise<import("./schemas/wallet.schema").WalletDocument>;
    transfer(userId: string, transferDto: TransferDto): Promise<{
        fromWallet: import("./schemas/wallet.schema").WalletDocument;
        toWallet: import("./schemas/wallet.schema").WalletDocument;
    }>;
    findByUser(userId: string): Promise<import("./schemas/wallet.schema").WalletDocument[]>;
}
