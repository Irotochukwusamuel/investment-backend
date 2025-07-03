import { InvestmentsService } from './investments.service';
import { CreateInvestmentRequestDto } from './dto/create-investment-request.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { Investment } from './schemas/investment.schema';
export declare class InvestmentsController {
    private readonly investmentsService;
    constructor(investmentsService: InvestmentsService);
    create(createInvestmentRequestDto: CreateInvestmentRequestDto, req: any): Promise<Investment>;
    findAll(query: any): Promise<Investment[]>;
    findMyInvestments(query: any, req: any): Promise<Investment[]>;
    getStats(userId?: string): Promise<any>;
    getActiveInvestments(): Promise<Investment[]>;
    getInvestmentsByCurrency(currency: string): Promise<Investment[]>;
    findOne(id: string): Promise<Investment>;
    update(id: string, updateInvestmentDto: UpdateInvestmentDto): Promise<Investment>;
    remove(id: string): Promise<void>;
    completeInvestment(id: string): Promise<Investment>;
    cancelInvestment(id: string, reason?: string): Promise<Investment>;
    updateRoi(id: string, earnedAmount: number): Promise<Investment>;
    withdrawBonus(req: any): Promise<{
        success: boolean;
        message: string;
        amount?: number;
    }>;
}
