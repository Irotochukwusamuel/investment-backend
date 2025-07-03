import { Document, Types } from 'mongoose';
export type WalletDocument = Wallet & Document;
export declare enum WalletType {
    MAIN = "main",
    PROFIT = "profit",
    BONUS = "bonus"
}
export declare class Wallet {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    type: WalletType;
    nairaBalance: number;
    usdtBalance: number;
    totalDeposits: number;
    totalWithdrawals: number;
    totalInvestments: number;
    totalEarnings: number;
    totalBonuses: number;
    totalReferralEarnings: number;
    lastTransactionDate?: Date;
    status: 'active' | 'suspended' | 'locked';
    createdAt: Date;
    updatedAt: Date;
}
export declare const WalletSchema: import("mongoose").Schema<Wallet, import("mongoose").Model<Wallet, any, any, any, Document<unknown, any, Wallet, any> & Wallet & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Wallet, Document<unknown, {}, import("mongoose").FlatRecord<Wallet>, {}> & import("mongoose").FlatRecord<Wallet> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
