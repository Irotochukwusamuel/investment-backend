import { InvestmentPlansService } from './investment-plans.service';
import { CreateInvestmentPlanDto } from './dto/create-investment-plan.dto';
import { UpdateInvestmentPlanDto } from './dto/update-investment-plan.dto';
import { InvestmentPlan } from './schemas/investment-plan.schema';
import { SeedsService } from '../seeds/seeds.service';
export declare class InvestmentPlansController {
    private readonly plansService;
    private readonly seedsService;
    constructor(plansService: InvestmentPlansService, seedsService: SeedsService);
    create(dto: CreateInvestmentPlanDto): Promise<InvestmentPlan>;
    findAll(): Promise<InvestmentPlan[]>;
    findOne(id: string): Promise<InvestmentPlan>;
    update(id: string, dto: UpdateInvestmentPlanDto): Promise<InvestmentPlan>;
    remove(id: string): Promise<void>;
    seed(): Promise<{
        message: string;
    }>;
}
