import { TransactionType, TransactionStatus } from '../schemas/transaction.schema';
export declare class CreateTransactionDto {
    userId: string;
    type: TransactionType;
    status?: TransactionStatus;
    amount: number;
    currency: 'naira' | 'usdt';
    reference?: string;
    description?: string;
    investmentId?: string;
    planId?: string;
}
