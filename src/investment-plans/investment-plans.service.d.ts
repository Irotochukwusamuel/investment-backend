import { Model } from 'mongoose';
import { InvestmentPlan, InvestmentPlanDocument } from './schemas/investment-plan.schema';
import { CreateInvestmentPlanDto } from './dto/create-investment-plan.dto';
import { UpdateInvestmentPlanDto } from './dto/update-investment-plan.dto';
export declare class InvestmentPlansService {
    private planModel;
    constructor(planModel: Model<InvestmentPlanDocument>);
    create(createDto: CreateInvestmentPlanDto): Promise<InvestmentPlan>;
    findAll(): Promise<InvestmentPlan[]>;
    findById(id: string): Promise<InvestmentPlan>;
    update(id: string, updateDto: UpdateInvestmentPlanDto): Promise<InvestmentPlan>;
    remove(id: string): Promise<void>;
}
