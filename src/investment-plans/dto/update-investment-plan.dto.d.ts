import { CreateInvestmentPlanDto } from './create-investment-plan.dto';
declare const UpdateInvestmentPlanDto_base: import("@nestjs/common").Type<Partial<CreateInvestmentPlanDto>>;
export declare class UpdateInvestmentPlanDto extends UpdateInvestmentPlanDto_base {
    name?: string;
    description?: string;
    currency?: 'naira' | 'usdt';
    minAmount?: number;
    maxAmount?: number;
    dailyRoi?: number;
    totalRoi?: number;
    duration?: number;
    welcomeBonus?: number;
    referralBonus?: number;
    features?: string[];
    icon?: string;
    sortOrder?: number;
    isActive?: boolean;
    isPopular?: boolean;
    isRecommended?: boolean;
}
export {};
