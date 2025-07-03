import { Document, Types } from 'mongoose';
export type InvestmentDocument = Investment & Document;
export declare enum InvestmentStatus {
    ACTIVE = "active",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    SUSPENDED = "suspended"
}
export declare enum InvestmentType {
    FIXED = "fixed",
    FLEXIBLE = "flexible"
}
export declare class Investment {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    planId: Types.ObjectId;
    amount: number;
    currency: 'naira' | 'usdt';
    dailyRoi: number;
    totalRoi: number;
    duration: number;
    startDate: Date;
    endDate: Date;
    earnedAmount: number;
    expectedReturn: number;
    status: InvestmentStatus;
    type: InvestmentType;
    autoReinvest: boolean;
    lastRoiUpdate: Date;
    nextRoiUpdate: Date;
    welcomeBonus: number;
    referralBonus: number;
    transactionId?: Types.ObjectId;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const InvestmentSchema: import("mongoose").Schema<Investment, import("mongoose").Model<Investment, any, any, any, Document<unknown, any, Investment, any> & Investment & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Investment, Document<unknown, {}, import("mongoose").FlatRecord<Investment>, {}> & import("mongoose").FlatRecord<Investment> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
