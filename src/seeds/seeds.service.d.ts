import { Model } from 'mongoose';
import { InvestmentPlanDocument } from '../investment-plans/schemas/investment-plan.schema';
import { UserDocument } from '../users/schemas/user.schema';
export declare class SeedsService {
    private planModel;
    private userModel;
    private readonly logger;
    constructor(planModel: Model<InvestmentPlanDocument>, userModel: Model<UserDocument>);
    seedAll(): Promise<void>;
    seedInvestmentPlans(): Promise<void>;
    seedAdminUser(): Promise<void>;
    clearDatabase(): Promise<void>;
    resetAndSeed(): Promise<void>;
}
