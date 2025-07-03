"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const transaction_schema_1 = require("./schemas/transaction.schema");
const email_service_1 = require("../email/email.service");
const users_service_1 = require("../users/users.service");
let TransactionsService = class TransactionsService {
    transactionModel;
    emailService;
    usersService;
    constructor(transactionModel, emailService, usersService) {
        this.transactionModel = transactionModel;
        this.emailService = emailService;
        this.usersService = usersService;
    }
    async create(createTransactionDto) {
        const transaction = new this.transactionModel({
            ...createTransactionDto,
            userId: new mongoose_2.Types.ObjectId(createTransactionDto.userId),
            investmentId: createTransactionDto.investmentId ? new mongoose_2.Types.ObjectId(createTransactionDto.investmentId) : undefined,
            planId: createTransactionDto.planId ? new mongoose_2.Types.ObjectId(createTransactionDto.planId) : undefined,
        });
        const savedTransaction = await transaction.save();
        if (createTransactionDto.type === transaction_schema_1.TransactionType.WITHDRAWAL) {
            try {
                const user = await this.usersService.findById(createTransactionDto.userId);
                if (user) {
                    await this.emailService.sendWithdrawalRequestEmail(user.email, user.firstName || user.email, {
                        amount: createTransactionDto.amount,
                        currency: createTransactionDto.currency,
                        withdrawalMethod: 'bank_transfer',
                        reference: savedTransaction.reference,
                        requestDate: savedTransaction.createdAt,
                        accountDetails: createTransactionDto.description,
                    });
                }
            }
            catch (error) {
                console.error('Failed to send withdrawal request email:', error);
            }
        }
        if (createTransactionDto.type === transaction_schema_1.TransactionType.DEPOSIT) {
            try {
                const user = await this.usersService.findById(createTransactionDto.userId);
                if (user) {
                    await this.emailService.sendDepositRequestEmail(user.email, user.firstName || user.email, {
                        amount: createTransactionDto.amount,
                        currency: createTransactionDto.currency,
                        paymentMethod: 'bank_transfer',
                        reference: savedTransaction.reference,
                        requestDate: savedTransaction.createdAt,
                        accountDetails: createTransactionDto.description,
                    });
                }
            }
            catch (error) {
                console.error('Failed to send deposit request email:', error);
            }
        }
        return savedTransaction;
    }
    async findAll(query = {}) {
        const { userId, status, type, currency, limit = 50, page = 1 } = query;
        const filter = {};
        if (userId)
            filter.userId = new mongoose_2.Types.ObjectId(userId);
        if (status)
            filter.status = status;
        if (type)
            filter.type = type;
        if (currency)
            filter.currency = currency;
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
    async findOne(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid transaction ID');
        }
        const transaction = await this.transactionModel
            .findById(id)
            .populate('userId', 'firstName lastName email')
            .populate('investmentId', 'amount planId')
            .populate('planId', 'name')
            .exec();
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        return transaction;
    }
    async update(id, updateTransactionDto) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid transaction ID');
        }
        const transaction = await this.transactionModel
            .findByIdAndUpdate(id, updateTransactionDto, { new: true, runValidators: true })
            .exec();
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        return transaction;
    }
    async remove(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid transaction ID');
        }
        const transaction = await this.transactionModel.findByIdAndDelete(id).exec();
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
    }
    async process(id, processDto) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid transaction ID');
        }
        const transaction = await this.transactionModel
            .findByIdAndUpdate(id, { status: processDto.status }, { new: true, runValidators: true })
            .exec();
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        return transaction;
    }
    async findByUser(userId, query = {}) {
        const { status, type, currency, limit = 50, page = 1 } = query;
        const filter = { userId: new mongoose_2.Types.ObjectId(userId) };
        if (status)
            filter.status = status;
        if (type)
            filter.type = type;
        if (currency)
            filter.currency = currency;
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
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        email_service_1.EmailService,
        users_service_1.UsersService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map