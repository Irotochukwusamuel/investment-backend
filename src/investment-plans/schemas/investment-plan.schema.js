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
exports.InvestmentPlanSchema = exports.InvestmentPlan = exports.InvestmentPlanStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
var InvestmentPlanStatus;
(function (InvestmentPlanStatus) {
    InvestmentPlanStatus["ACTIVE"] = "active";
    InvestmentPlanStatus["INACTIVE"] = "inactive";
})(InvestmentPlanStatus || (exports.InvestmentPlanStatus = InvestmentPlanStatus = {}));
let InvestmentPlan = class InvestmentPlan {
    _id;
    name;
    description;
    currency;
    minAmount;
    maxAmount;
    dailyRoi;
    totalRoi;
    duration;
    welcomeBonus;
    referralBonus;
    features;
    popularity;
    totalInvestors;
    totalVolume;
    status;
    priority;
    icon;
    color;
    autoReinvestEnabled;
    earlyWithdrawalPenalty;
    minWithdrawalAmount;
    maxWithdrawalAmount;
    withdrawalProcessingTime;
    createdAt;
    updatedAt;
    currentTotalInvestment;
    maxTotalInvestment;
    featured;
};
exports.InvestmentPlan = InvestmentPlan;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment plan ID' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], InvestmentPlan.prototype, "_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Plan name' }),
    (0, mongoose_1.Prop)({ required: true, unique: true, trim: true }),
    __metadata("design:type", String)
], InvestmentPlan.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Plan description' }),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], InvestmentPlan.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Plan currency (naira or usdt)' }),
    (0, mongoose_1.Prop)({ required: true, enum: ['naira', 'usdt'] }),
    __metadata("design:type", String)
], InvestmentPlan.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Minimum investment amount' }),
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], InvestmentPlan.prototype, "minAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Maximum investment amount' }),
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], InvestmentPlan.prototype, "maxAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Daily ROI percentage' }),
    (0, mongoose_1.Prop)({ required: true, min: 0, max: 100 }),
    __metadata("design:type", Number)
], InvestmentPlan.prototype, "dailyRoi", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total ROI percentage' }),
    (0, mongoose_1.Prop)({ required: true, min: 0, max: 1000 }),
    __metadata("design:type", Number)
], InvestmentPlan.prototype, "totalRoi", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment duration in days' }),
    (0, mongoose_1.Prop)({ required: true, min: 1 }),
    __metadata("design:type", Number)
], InvestmentPlan.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Welcome bonus percentage' }),
    (0, mongoose_1.Prop)({ default: 0, min: 0, max: 100 }),
    __metadata("design:type", Number)
], InvestmentPlan.prototype, "welcomeBonus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Referral bonus percentage' }),
    (0, mongoose_1.Prop)({ default: 0, min: 0, max: 100 }),
    __metadata("design:type", Number)
], InvestmentPlan.prototype, "referralBonus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Plan features' }),
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], InvestmentPlan.prototype, "features", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Plan popularity score' }),
    (0, mongoose_1.Prop)({ default: 0, min: 0, max: 100 }),
    __metadata("design:type", Number)
], InvestmentPlan.prototype, "popularity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of investors' }),
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], InvestmentPlan.prototype, "totalInvestors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total investment volume' }),
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], InvestmentPlan.prototype, "totalVolume", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Plan status' }),
    (0, mongoose_1.Prop)({ default: InvestmentPlanStatus.ACTIVE, enum: InvestmentPlanStatus }),
    __metadata("design:type", String)
], InvestmentPlan.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Plan priority for display' }),
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], InvestmentPlan.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Plan icon or image URL' }),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], InvestmentPlan.prototype, "icon", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Plan color theme' }),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], InvestmentPlan.prototype, "color", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Auto-reinvest enabled' }),
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], InvestmentPlan.prototype, "autoReinvestEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Early withdrawal penalty percentage' }),
    (0, mongoose_1.Prop)({ default: 0, min: 0, max: 100 }),
    __metadata("design:type", Number)
], InvestmentPlan.prototype, "earlyWithdrawalPenalty", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Minimum withdrawal amount' }),
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], InvestmentPlan.prototype, "minWithdrawalAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Maximum withdrawal amount' }),
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], InvestmentPlan.prototype, "maxWithdrawalAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Withdrawal processing time in hours' }),
    (0, mongoose_1.Prop)({ default: 24, min: 0 }),
    __metadata("design:type", Number)
], InvestmentPlan.prototype, "withdrawalProcessingTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Plan created at timestamp' }),
    __metadata("design:type", Date)
], InvestmentPlan.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Plan updated at timestamp' }),
    __metadata("design:type", Date)
], InvestmentPlan.prototype, "updatedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], InvestmentPlan.prototype, "currentTotalInvestment", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], InvestmentPlan.prototype, "maxTotalInvestment", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], InvestmentPlan.prototype, "featured", void 0);
exports.InvestmentPlan = InvestmentPlan = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], InvestmentPlan);
exports.InvestmentPlanSchema = mongoose_1.SchemaFactory.createForClass(InvestmentPlan);
exports.InvestmentPlanSchema.index({ currency: 1, status: 1 });
exports.InvestmentPlanSchema.index({ status: 1, priority: -1 });
exports.InvestmentPlanSchema.index({ minAmount: 1, maxAmount: 1 });
exports.InvestmentPlanSchema.index({ dailyRoi: -1 });
exports.InvestmentPlanSchema.index({ popularity: -1 });
exports.InvestmentPlanSchema.index({ name: 1 });
exports.InvestmentPlanSchema.virtual('dailyRoiFormatted').get(function () {
    return `${this.dailyRoi}%`;
});
exports.InvestmentPlanSchema.virtual('totalRoiFormatted').get(function () {
    return `${this.totalRoi}%`;
});
exports.InvestmentPlanSchema.virtual('amountRange').get(function () {
    const currency = this.currency === 'naira' ? '₦' : 'USDT';
    return `${currency}${this.minAmount.toLocaleString()} - ${currency}${this.maxAmount.toLocaleString()}`;
});
exports.InvestmentPlanSchema.virtual('durationFormatted').get(function () {
    return `${this.duration} days`;
});
exports.InvestmentPlanSchema.set('toJSON', { virtuals: true });
exports.InvestmentPlanSchema.set('toObject', { virtuals: true });
//# sourceMappingURL=investment-plan.schema.js.map