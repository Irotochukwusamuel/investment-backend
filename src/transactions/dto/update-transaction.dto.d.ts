import { CreateTransactionDto } from './create-transaction.dto';
import { TransactionStatus } from '../schemas/transaction.schema';
declare const UpdateTransactionDto_base: import("@nestjs/common").Type<Partial<CreateTransactionDto>>;
export declare class UpdateTransactionDto extends UpdateTransactionDto_base {
    status?: TransactionStatus;
}
export {};
