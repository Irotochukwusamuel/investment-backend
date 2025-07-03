import { InvestmentPlanStatus } from '../schemas/investment-plan.schema';
export declare class CreateInvestmentPlanDto {
    name: string;
    description: string;
    currency: 'naira' | 'usdt';
    minAmount: number;
    maxAmount: number;
    dailyRoi: number;
    totalRoi: number;
    duration: number;
    welcomeBonus?: number;
    referralBonus?: number;
    features?: string[];
    popularity?: number;
    totalInvestors?: number;
    totalVolume?: number;
    status?: InvestmentPlanStatus;
    priority?: number;
    icon?: string;
    color?: string;
    autoReinvestEnabled?: boolean;
    earlyWithdrawalPenalty?: number;
    minWithdrawalAmount?: number;
    maxWithdrawalAmount?: number;
    withdrawalProcessingTime?: number;
    currentTotalInvestment?: number;
    maxTotalInvestment?: number;
    featured?: boolean;
}
