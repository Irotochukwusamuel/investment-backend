import { Model } from 'mongoose';
import { InvestmentDocument } from '../investments/schemas/investment.schema';
import { TransactionDocument } from '../transactions/schemas/transaction.schema';
import { WalletService } from '../wallet/wallet.service';
import { EmailService } from '../email/email.service';
export declare class TasksService {
    private investmentModel;
    private transactionModel;
    private readonly walletService;
    private readonly emailService;
    private readonly logger;
    constructor(investmentModel: Model<InvestmentDocument>, transactionModel: Model<TransactionDocument>, walletService: WalletService, emailService: EmailService);
    updateInvestmentRoi(): Promise<void>;
    processPendingTransactions(): Promise<void>;
    cleanupOldData(): Promise<void>;
    generateWeeklyReports(): Promise<void>;
    private createRoiTransaction;
    private processDepositTransaction;
    private processWithdrawalTransaction;
    private processInvestmentTransaction;
}
