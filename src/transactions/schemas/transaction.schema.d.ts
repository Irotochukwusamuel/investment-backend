import { Document, Types } from 'mongoose';
export type TransactionDocument = Transaction & Document;
export declare enum TransactionStatus {
    PENDING = "pending",
    SUCCESS = "success",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare enum TransactionType {
    DEPOSIT = "deposit",
    WITHDRAWAL = "withdrawal",
    INVESTMENT = "investment",
    ROI = "roi",
    REFERRAL = "referral",
    BONUS = "bonus",
    TRANSFER = "transfer",
    ADJUSTMENT = "adjustment"
}
export declare class Transaction {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    type: TransactionType;
    status: TransactionStatus;
    amount: number;
    currency: 'naira' | 'usdt';
    description: string;
    reference?: string;
    externalReference?: string;
    investmentId?: Types.ObjectId;
    planId?: Types.ObjectId;
    relatedTransactionId?: Types.ObjectId;
    fee?: number;
    feePercentage?: number;
    netAmount?: number;
    exchangeRate?: number;
    convertedAmount?: number;
    convertedCurrency?: string;
    paymentMethod?: string;
    paymentProvider?: string;
    paymentDetails?: {
        bankName?: string;
        accountNumber?: string;
        accountName?: string;
        walletAddress?: string;
        network?: string;
        transactionHash?: string;
    };
    metadata?: {
        ip?: string;
        userAgent?: string;
        location?: string;
        device?: string;
        [key: string]: any;
    };
    processedAt?: Date;
    processedBy?: Types.ObjectId;
    failedAt?: Date;
    failureReason?: string;
    cancelledAt?: Date;
    cancelledBy?: Types.ObjectId;
    cancellationReason?: string;
    retryCount: number;
    nextRetryAt?: Date;
    isReversed: boolean;
    reversalTransactionId?: Types.ObjectId;
    reversedAt?: Date;
    reversedBy?: Types.ObjectId;
    reversalReason?: string;
    notes: string[];
    tags?: string[];
    priority: number;
    isAutomated: boolean;
    scheduledAt?: Date;
    executedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    get isOverdue(): boolean;
    get canBeRetried(): boolean;
    get canBeCancelled(): boolean;
    get canBeReversed(): boolean;
    get isHighPriority(): boolean;
    get formattedAmount(): string;
    get formattedNetAmount(): string;
}
export declare const TransactionSchema: import("mongoose").Schema<Transaction, import("mongoose").Model<Transaction, any, any, any, Document<unknown, any, Transaction, any> & Transaction & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Transaction, Document<unknown, {}, import("mongoose").FlatRecord<Transaction>, {}> & import("mongoose").FlatRecord<Transaction> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
