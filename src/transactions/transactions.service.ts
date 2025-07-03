import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument, TransactionStatus, TransactionType } from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ProcessTransactionDto } from './dto/process-transaction.dto';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
  ) {}

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const transaction = new this.transactionModel({
      ...createTransactionDto,
      userId: new Types.ObjectId(createTransactionDto.userId),
      investmentId: createTransactionDto.investmentId ? new Types.ObjectId(createTransactionDto.investmentId) : undefined,
      planId: createTransactionDto.planId ? new Types.ObjectId(createTransactionDto.planId) : undefined,
    });
    
    const savedTransaction = await transaction.save();
    
    // Send withdrawal request email if it's a withdrawal transaction
    if (createTransactionDto.type === TransactionType.WITHDRAWAL) {
      try {
        const user = await this.usersService.findById(createTransactionDto.userId);
        if (user) {
          await this.emailService.sendWithdrawalRequestEmail(
            user.email,
            user.firstName || user.email,
            {
              amount: createTransactionDto.amount,
              currency: createTransactionDto.currency,
              withdrawalMethod: 'bank_transfer', // This should come from the request
              reference: savedTransaction.reference,
              requestDate: savedTransaction.createdAt,
              accountDetails: createTransactionDto.description,
            }
          );
        }
      } catch (error) {
        console.error('Failed to send withdrawal request email:', error);
        // Don't fail the transaction creation if email fails
      }
    }
    
    // Send deposit request email if it's a deposit transaction
    if (createTransactionDto.type === TransactionType.DEPOSIT) {
      try {
        const user = await this.usersService.findById(createTransactionDto.userId);
        if (user) {
          await this.emailService.sendDepositRequestEmail(
            user.email,
            user.firstName || user.email,
            {
              amount: createTransactionDto.amount,
              currency: createTransactionDto.currency,
              paymentMethod: 'bank_transfer', // This should come from the request
              reference: savedTransaction.reference,
              requestDate: savedTransaction.createdAt,
              accountDetails: createTransactionDto.description,
            }
          );
        }
      } catch (error) {
        console.error('Failed to send deposit request email:', error);
        // Don't fail the transaction creation if email fails
      }
    }
    
    return savedTransaction;
  }

  async findAll(query: any = {}): Promise<Transaction[]> {
    const { userId, status, type, currency, limit = 50, page = 1 } = query;
    const filter: any = {};
    if (userId) filter.userId = new Types.ObjectId(userId);
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (currency) filter.currency = currency;
    const skip = (page - 1) * limit;
    return this.transactionModel
      .find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('investmentId', 'amount planId')
      .populate('planId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async findOne(id: string): Promise<Transaction> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transaction ID');
    }
    const transaction = await this.transactionModel
      .findById(id)
      .populate('userId', 'firstName lastName email')
      .populate('investmentId', 'amount planId')
      .populate('planId', 'name')
      .exec();
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transaction ID');
    }
    const transaction = await this.transactionModel
      .findByIdAndUpdate(id, updateTransactionDto, { new: true, runValidators: true })
      .exec();
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transaction ID');
    }
    const transaction = await this.transactionModel.findByIdAndDelete(id).exec();
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
  }

  async process(id: string, processDto: ProcessTransactionDto): Promise<Transaction> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transaction ID');
    }
    const transaction = await this.transactionModel
      .findByIdAndUpdate(id, { status: processDto.status }, { new: true, runValidators: true })
      .exec();
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  async findByUser(userId: string, query: any = {}): Promise<Transaction[]> {
    const { status, type, currency, limit = 50, page = 1 } = query;
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (currency) filter.currency = currency;
    const skip = (page - 1) * limit;
    return this.transactionModel
      .find(filter)
      .populate('investmentId', 'amount planId')
      .populate('planId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }
} 