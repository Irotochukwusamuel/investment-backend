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
exports.InvestmentSchema = exports.Investment = exports.InvestmentType = exports.InvestmentStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
var InvestmentStatus;
(function (InvestmentStatus) {
    InvestmentStatus["ACTIVE"] = "active";
    InvestmentStatus["COMPLETED"] = "completed";
    InvestmentStatus["CANCELLED"] = "cancelled";
    InvestmentStatus["SUSPENDED"] = "suspended";
})(InvestmentStatus || (exports.InvestmentStatus = InvestmentStatus = {}));
var InvestmentType;
(function (InvestmentType) {
    InvestmentType["FIXED"] = "fixed";
    InvestmentType["FLEXIBLE"] = "flexible";
})(InvestmentType || (exports.InvestmentType = InvestmentType = {}));
let Investment = class Investment {
    _id;
    userId;
    planId;
    amount;
    currency;
    dailyRoi;
    totalRoi;
    duration;
    startDate;
    endDate;
    earnedAmount;
    expectedReturn;
    status;
    type;
    autoReinvest;
    lastRoiUpdate;
    nextRoiUpdate;
    welcomeBonus;
    referralBonus;
    transactionId;
    notes;
    createdAt;
    updatedAt;
};
exports.Investment = Investment;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment ID' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Investment.prototype, "_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID who made the investment' }),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Investment.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment plan ID' }),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'InvestmentPlan', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Investment.prototype, "planId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment amount' }),
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], Investment.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment currency' }),
    (0, mongoose_1.Prop)({ required: true, enum: ['naira', 'usdt'] }),
    __metadata("design:type", String)
], Investment.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Daily ROI percentage' }),
    (0, mongoose_1.Prop)({ required: true, min: 0, max: 100 }),
    __metadata("design:type", Number)
], Investment.prototype, "dailyRoi", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total ROI percentage' }),
    (0, mongoose_1.Prop)({ required: true, min: 0, max: 1000 }),
    __metadata("design:type", Number)
], Investment.prototype, "totalRoi", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment duration in days' }),
    (0, mongoose_1.Prop)({ required: true, min: 1 }),
    __metadata("design:type", Number)
], Investment.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment start date' }),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Investment.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment end date' }),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Investment.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current earned amount' }),
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], Investment.prototype, "earnedAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total expected return' }),
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], Investment.prototype, "expectedReturn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment status' }),
    (0, mongoose_1.Prop)({ default: InvestmentStatus.ACTIVE, enum: InvestmentStatus }),
    __metadata("design:type", String)
], Investment.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment type' }),
    (0, mongoose_1.Prop)({ default: InvestmentType.FIXED, enum: InvestmentType }),
    __metadata("design:type", String)
], Investment.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Auto-reinvest enabled' }),
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Investment.prototype, "autoReinvest", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last ROI update timestamp' }),
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], Investment.prototype, "lastRoiUpdate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Next ROI update timestamp' }),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Investment.prototype, "nextRoiUpdate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Welcome bonus amount' }),
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], Investment.prototype, "welcomeBonus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Referral bonus amount' }),
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], Investment.prototype, "referralBonus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction ID for the investment' }),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Transaction' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Investment.prototype, "transactionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment notes' }),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Investment.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment created at timestamp' }),
    __metadata("design:type", Date)
], Investment.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment updated at timestamp' }),
    __metadata("design:type", Date)
], Investment.prototype, "updatedAt", void 0);
exports.Investment = Investment = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Investment);
exports.InvestmentSchema = mongoose_1.SchemaFactory.createForClass(Investment);
exports.InvestmentSchema.index({ userId: 1, status: 1 });
exports.InvestmentSchema.index({ planId: 1, status: 1 });
exports.InvestmentSchema.index({ status: 1, nextRoiUpdate: 1 });
exports.InvestmentSchema.index({ startDate: 1, endDate: 1 });
exports.InvestmentSchema.index({ createdAt: -1 });
exports.InvestmentSchema.virtual('earnedAmountFormatted').get(function () {
    const currency = this.currency === 'naira' ? '₦' : 'USDT';
    return `${currency}${this.earnedAmount.toLocaleString()}`;
});
exports.InvestmentSchema.virtual('expectedReturnFormatted').get(function () {
    const currency = this.currency === 'naira' ? '₦' : 'USDT';
    return `${currency}${this.expectedReturn.toLocaleString()}`;
});
exports.InvestmentSchema.virtual('amountFormatted').get(function () {
    const currency = this.currency === 'naira' ? '₦' : 'USDT';
    return `${currency}${this.amount.toLocaleString()}`;
});
exports.InvestmentSchema.virtual('daysRemaining').get(function () {
    const now = new Date();
    const end = new Date(this.endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
});
exports.InvestmentSchema.virtual('progressPercentage').get(function () {
    const now = new Date();
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const percentage = (elapsed / totalDuration) * 100;
    return Math.min(100, Math.max(0, percentage));
});
exports.InvestmentSchema.set('toJSON', { virtuals: true });
exports.InvestmentSchema.set('toObject', { virtuals: true });
//# sourceMappingURL=investment.schema.js.map