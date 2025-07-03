import { Document, Types } from 'mongoose';
export type InvestmentPlanDocument = InvestmentPlan & Document;
export declare enum InvestmentPlanStatus {
    ACTIVE = "active",
    INACTIVE = "inactive"
}
export declare class InvestmentPlan {
    _id: Types.ObjectId;
    name: string;
    description: string;
    currency: 'naira' | 'usdt';
    minAmount: number;
    maxAmount: number;
    dailyRoi: number;
    totalRoi: number;
    duration: number;
    welcomeBonus: number;
    referralBonus: number;
    features: string[];
    popularity: number;
    totalInvestors: number;
    totalVolume: number;
    status: InvestmentPlanStatus;
    priority: number;
    icon?: string;
    color?: string;
    autoReinvestEnabled: boolean;
    earlyWithdrawalPenalty: number;
    minWithdrawalAmount: number;
    maxWithdrawalAmount: number;
    withdrawalProcessingTime: number;
    createdAt: Date;
    updatedAt: Date;
    currentTotalInvestment: number;
    maxTotalInvestment: number;
    featured: boolean;
}
export declare const InvestmentPlanSchema: import("mongoose").Schema<InvestmentPlan, import("mongoose").Model<InvestmentPlan, any, any, any, Document<unknown, any, InvestmentPlan, any> & InvestmentPlan & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, InvestmentPlan, Document<unknown, {}, import("mongoose").FlatRecord<InvestmentPlan>, {}> & import("mongoose").FlatRecord<InvestmentPlan> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
