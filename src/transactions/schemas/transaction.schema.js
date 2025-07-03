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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionSchema = exports.Transaction = exports.TransactionType = exports.TransactionStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["SUCCESS"] = "success";
    TransactionStatus["FAILED"] = "failed";
    TransactionStatus["CANCELLED"] = "cancelled";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["DEPOSIT"] = "deposit";
    TransactionType["WITHDRAWAL"] = "withdrawal";
    TransactionType["INVESTMENT"] = "investment";
    TransactionType["ROI"] = "roi";
    TransactionType["REFERRAL"] = "referral";
    TransactionType["BONUS"] = "bonus";
    TransactionType["TRANSFER"] = "transfer";
    TransactionType["ADJUSTMENT"] = "adjustment";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
let Transaction = class Transaction {
    _id;
    userId;
    type;
    status;
    amount;
    currency;
    description;
    reference;
    externalReference;
    investmentId;
    planId;
    relatedTransactionId;
    fee;
    feePercentage;
    netAmount;
    exchangeRate;
    convertedAmount;
    convertedCurrency;
    paymentMethod;
    paymentProvider;
    paymentDetails;
    metadata;
    processedAt;
    processedBy;
    failedAt;
    failureReason;
    cancelledAt;
    cancelledBy;
    cancellationReason;
    retryCount;
    nextRetryAt;
    isReversed;
    reversalTransactionId;
    reversedAt;
    reversedBy;
    reversalReason;
    notes;
    tags;
    priority;
    isAutomated;
    scheduledAt;
    executedAt;
    createdAt;
    updatedAt;
    get isOverdue() {
        if (this.status !== 'pending')
            return false;
        const hoursSinceCreation = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceCreation > 24;
    }
    get canBeRetried() {
        return this.status === 'failed' && this.retryCount < 3;
    }
    get canBeCancelled() {
        return this.status === 'pending' && !this.isAutomated;
    }
    get canBeReversed() {
        return this.status === TransactionStatus.SUCCESS && !this.isReversed;
    }
    get isHighPriority() {
        return this.priority >= 8 || this.amount > 1000000;
    }
    get formattedAmount() {
        const symbol = this.currency === 'naira' ? '₦' : 'USDT';
        return `${symbol}${this.amount.toLocaleString()}`;
    }
    get formattedNetAmount() {
        if (!this.netAmount)
            return this.formattedAmount;
        const symbol = this.currency === 'naira' ? '₦' : 'USDT';
        return `${symbol}${this.netAmount.toLocaleString()}`;
    }
};
exports.Transaction = Transaction;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction ID' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Transaction.prototype, "_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID' }),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Transaction.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction type' }),
    (0, mongoose_1.Prop)({ required: true, enum: TransactionType }),
    __metadata("design:type", String)
], Transaction.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction status' }),
    (0, mongoose_1.Prop)({ required: true, enum: TransactionStatus, default: TransactionStatus.PENDING }),
    __metadata("design:type", String)
], Transaction.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction amount' }),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Transaction.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction currency' }),
    (0, mongoose_1.Prop)({ required: true, enum: ['naira', 'usdt'] }),
    __metadata("design:type", String)
], Transaction.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction description' }),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Transaction.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction reference' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], Transaction.prototype, "reference", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'External transaction reference' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], Transaction.prototype, "externalReference", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Related investment ID' }),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Investment' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Transaction.prototype, "investmentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Related investment plan ID' }),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'InvestmentPlan' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Transaction.prototype, "planId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Related transaction ID' }),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Transaction' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Transaction.prototype, "relatedTransactionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction fee' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Number)
], Transaction.prototype, "fee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction fee percentage' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Number)
], Transaction.prototype, "feePercentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Net transaction amount' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Number)
], Transaction.prototype, "netAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction exchange rate' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Number)
], Transaction.prototype, "exchangeRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Converted transaction amount' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Number)
], Transaction.prototype, "convertedAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Converted transaction currency' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], Transaction.prototype, "convertedCurrency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Payment method' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], Transaction.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Payment provider' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], Transaction.prototype, "paymentProvider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Payment details' }),
    (0, mongoose_1.Prop)({ type: Object, default: null }),
    __metadata("design:type", Object)
], Transaction.prototype, "paymentDetails", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction metadata' }),
    (0, mongoose_1.Prop)({ type: Object, default: null }),
    __metadata("design:type", Object)
], Transaction.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Processing date' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Date)
], Transaction.prototype, "processedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Processed by' }),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Transaction.prototype, "processedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Failed date' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Date)
], Transaction.prototype, "failedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Failure reason' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], Transaction.prototype, "failureReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cancelled date' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Date)
], Transaction.prototype, "cancelledAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cancelled by' }),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Transaction.prototype, "cancelledBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cancellation reason' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], Transaction.prototype, "cancellationReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Retry count' }),
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Transaction.prototype, "retryCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Next retry date' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Date)
], Transaction.prototype, "nextRetryAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Is reversed' }),
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Transaction.prototype, "isReversed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Reversal transaction ID' }),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Transaction' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Transaction.prototype, "reversalTransactionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Reversed date' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Date)
], Transaction.prototype, "reversedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Reversed by' }),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Transaction.prototype, "reversedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Reversal reason' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], Transaction.prototype, "reversalReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction notes' }),
    (0, mongoose_1.Prop)({ default: [] }),
    __metadata("design:type", Array)
], Transaction.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction tags' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Array)
], Transaction.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction priority' }),
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Transaction.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Is automated' }),
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Transaction.prototype, "isAutomated", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Scheduled date' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Date)
], Transaction.prototype, "scheduledAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Executed date' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Date)
], Transaction.prototype, "executedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction created at timestamp' }),
    __metadata("design:type", Date)
], Transaction.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction updated at timestamp' }),
    __metadata("design:type", Date)
], Transaction.prototype, "updatedAt", void 0);
exports.Transaction = Transaction = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Transaction);
exports.TransactionSchema = mongoose_1.SchemaFactory.createForClass(Transaction);
exports.TransactionSchema.index({ userId: 1, status: 1 });
exports.TransactionSchema.index({ type: 1, status: 1 });
exports.TransactionSchema.index({ status: 1, createdAt: -1 });
exports.TransactionSchema.index({ reference: 1 });
exports.TransactionSchema.index({ externalReference: 1 });
exports.TransactionSchema.index({ investmentId: 1 });
exports.TransactionSchema.index({ processedAt: 1 });
exports.TransactionSchema.index({ scheduledAt: 1 });
exports.TransactionSchema.index({ priority: -1, createdAt: 1 });
exports.TransactionSchema.virtual('isOverdue').get(function () {
    if (this.status !== 'pending')
        return false;
    const hoursSinceCreation = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation > 24;
});
exports.TransactionSchema.virtual('canBeRetried').get(function () {
    return this.status === 'failed' && this.retryCount < 3;
});
exports.TransactionSchema.virtual('canBeCancelled').get(function () {
    return this.status === 'pending' && !this.isAutomated;
});
exports.TransactionSchema.virtual('canBeReversed').get(function () {
    return this.status === TransactionStatus.SUCCESS && !this.isReversed;
});
exports.TransactionSchema.virtual('isHighPriority').get(function () {
    return this.priority >= 8 || this.amount > 1000000;
});
exports.TransactionSchema.virtual('formattedAmount').get(function () {
    const symbol = this.currency === 'naira' ? '₦' : 'USDT';
    return `${symbol}${this.amount.toLocaleString()}`;
});
exports.TransactionSchema.virtual('formattedNetAmount').get(function () {
    if (!this.netAmount)
        return this.formattedAmount;
    const symbol = this.currency === 'naira' ? '₦' : 'USDT';
    return `${symbol}${this.netAmount.toLocaleString()}`;
});
exports.TransactionSchema.set('toJSON', { virtuals: true });
exports.TransactionSchema.set('toObject', { virtuals: true });
exports.TransactionSchema.pre('save', function (next) {
    if (this.fee && this.fee > 0) {
        this.netAmount = this.amount - this.fee;
    }
    else if (this.feePercentage && this.feePercentage > 0) {
        this.fee = (this.amount * this.feePercentage) / 100;
        this.netAmount = this.amount - this.fee;
    }
    else {
        this.netAmount = this.amount;
    }
    if (this.type === 'withdrawal' && this.amount > 500000) {
        this.priority = 10;
    }
    else if (this.type === 'deposit' && this.amount > 1000000) {
        this.priority = 9;
    }
    else if (this.type === 'roi') {
        this.priority = 8;
    }
    else if (this.type === 'investment') {
        this.priority = 7;
    }
    else {
        this.priority = 5;
    }
    next();
});
exports.TransactionSchema.methods.markAsProcessed = function (processedBy) {
    this.status = 'completed';
    this.processedAt = new Date();
    this.processedBy = processedBy;
    return this.save();
};
exports.TransactionSchema.methods.markAsFailed = function (reason) {
    this.status = 'failed';
    this.failedAt = new Date();
    this.failureReason = reason;
    return this.save();
};
exports.TransactionSchema.methods.retry = function () {
    if (this.canBeRetried) {
        this.status = 'pending';
        this.retryCount += 1;
        this.nextRetryAt = new Date(Date.now() + (this.retryCount * 30 * 60 * 1000));
        return this.save();
    }
    throw new Error('Transaction cannot be retried');
};
exports.TransactionSchema.methods.cancel = function (cancelledBy, reason) {
    if (this.canBeCancelled) {
        this.status = 'cancelled';
        this.cancelledAt = new Date();
        this.cancelledBy = cancelledBy;
        this.cancellationReason = reason;
        return this.save();
    }
    throw new Error('Transaction cannot be cancelled');
};
exports.TransactionSchema.methods.reverse = function (reversedBy, reason) {
    if (this.canBeReversed) {
        this.isReversed = true;
        this.reversedAt = new Date();
        this.reversedBy = reversedBy;
        this.reversalReason = reason;
        return this.save();
    }
    throw new Error('Transaction cannot be reversed');
};
//# sourceMappingURL=transaction.schema.js.map