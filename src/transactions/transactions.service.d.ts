import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ProcessTransactionDto } from './dto/process-transaction.dto';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
export declare class TransactionsService {
    private transactionModel;
    private readonly emailService;
    private readonly usersService;
    constructor(transactionModel: Model<TransactionDocument>, emailService: EmailService, usersService: UsersService);
    create(createTransactionDto: CreateTransactionDto): Promise<Transaction>;
    findAll(query?: any): Promise<Transaction[]>;
    findOne(id: string): Promise<Transaction>;
    update(id: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction>;
    remove(id: string): Promise<void>;
    process(id: string, processDto: ProcessTransactionDto): Promise<Transaction>;
    findByUser(userId: string, query?: any): Promise<Transaction[]>;
}
