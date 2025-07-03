import { InvestmentType } from '../schemas/investment.schema';
export declare class CreateInvestmentDto {
    planId: string;
    amount: number;
    currency: 'naira' | 'usdt';
    dailyRoi: number;
    totalRoi: number;
    duration: number;
    startDate: Date;
    endDate: Date;
    expectedReturn: number;
    type?: InvestmentType;
    autoReinvest?: boolean;
    nextRoiUpdate: Date;
    welcomeBonus?: number;
    referralBonus?: number;
    transactionId?: string;
    notes?: string;
}
