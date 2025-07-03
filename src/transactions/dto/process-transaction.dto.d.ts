import { TransactionStatus } from '../schemas/transaction.schema';
export declare class ProcessTransactionDto {
    status: TransactionStatus;
    reason?: string;
}
