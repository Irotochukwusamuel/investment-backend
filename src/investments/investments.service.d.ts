import { Model } from 'mongoose';
import { Investment, InvestmentDocument } from './schemas/investment.schema';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { CreateInvestmentRequestDto } from './dto/create-investment-request.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { InvestmentPlanDocument } from '../investment-plans/schemas/investment-plan.schema';
import { WalletService } from '../wallet/wallet.service';
import { UsersService } from '../users/users.service';
import { TransactionsService } from '../transactions/transactions.service';
import { EmailService } from '../email/email.service';
export declare class InvestmentsService {
    private investmentModel;
    private investmentPlanModel;
    private readonly walletService;
    private readonly usersService;
    private readonly transactionsService;
    private readonly emailService;
    constructor(investmentModel: Model<InvestmentDocument>, investmentPlanModel: Model<InvestmentPlanDocument>, walletService: WalletService, usersService: UsersService, transactionsService: TransactionsService, emailService: EmailService);
    createFromRequest(createInvestmentRequestDto: CreateInvestmentRequestDto, userId: string): Promise<Investment>;
    create(createInvestmentDto: CreateInvestmentDto, userId: string): Promise<Investment>;
    findAll(query?: any): Promise<Investment[]>;
    findOne(id: string): Promise<Investment>;
    findByUserId(userId: string, query?: any): Promise<Investment[]>;
    update(id: string, updateInvestmentDto: UpdateInvestmentDto): Promise<Investment>;
    remove(id: string): Promise<void>;
    updateRoi(id: string, earnedAmount: number): Promise<Investment>;
    completeInvestment(id: string): Promise<Investment>;
    cancelInvestment(id: string, reason?: string): Promise<Investment>;
    getInvestmentsForRoiUpdate(): Promise<Investment[]>;
    getInvestmentStats(userId?: string): Promise<any>;
    getInvestmentsByCurrency(currency: string): Promise<Investment[]>;
    getActiveInvestments(): Promise<Investment[]>;
    withdrawBonus(userId: string): Promise<{
        success: boolean;
        message: string;
        amount?: number;
    }>;
}
