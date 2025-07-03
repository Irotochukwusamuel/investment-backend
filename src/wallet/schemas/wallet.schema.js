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
exports.WalletSchema = exports.Wallet = exports.WalletType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
var WalletType;
(function (WalletType) {
    WalletType["MAIN"] = "main";
    WalletType["PROFIT"] = "profit";
    WalletType["BONUS"] = "bonus";
})(WalletType || (exports.WalletType = WalletType = {}));
let Wallet = class Wallet {
    _id;
    userId;
    type;
    nairaBalance;
    usdtBalance;
    totalDeposits;
    totalWithdrawals;
    totalInvestments;
    totalEarnings;
    totalBonuses;
    totalReferralEarnings;
    lastTransactionDate;
    status;
    createdAt;
    updatedAt;
};
exports.Wallet = Wallet;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Wallet ID' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Wallet.prototype, "_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID' }),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Wallet.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Wallet type' }),
    (0, mongoose_1.Prop)({ required: true, enum: WalletType, default: WalletType.MAIN }),
    __metadata("design:type", String)
], Wallet.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Naira balance' }),
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "nairaBalance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'USDT balance' }),
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "usdtBalance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total deposits' }),
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "totalDeposits", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total withdrawals' }),
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "totalWithdrawals", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total investments' }),
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "totalInvestments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total earnings' }),
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "totalEarnings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total bonuses' }),
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "totalBonuses", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total referral earnings' }),
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "totalReferralEarnings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last transaction date' }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Date)
], Wallet.prototype, "lastTransactionDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Wallet status' }),
    (0, mongoose_1.Prop)({ default: 'active', enum: ['active', 'suspended', 'locked'] }),
    __metadata("design:type", String)
], Wallet.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Wallet created at timestamp' }),
    __metadata("design:type", Date)
], Wallet.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Wallet updated at timestamp' }),
    __metadata("design:type", Date)
], Wallet.prototype, "updatedAt", void 0);
exports.Wallet = Wallet = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Wallet);
exports.WalletSchema = mongoose_1.SchemaFactory.createForClass(Wallet);
exports.WalletSchema.index({ userId: 1, type: 1 });
exports.WalletSchema.index({ userId: 1, status: 1 });
exports.WalletSchema.index({ type: 1, status: 1 });
exports.WalletSchema.virtual('nairaBalanceFormatted').get(function () {
    return `₦${this.nairaBalance.toLocaleString()}`;
});
exports.WalletSchema.virtual('usdtBalanceFormatted').get(function () {
    return `USDT ${this.usdtBalance.toLocaleString()}`;
});
exports.WalletSchema.virtual('totalBalanceNaira').get(function () {
    const usdtInNaira = this.usdtBalance * 1500;
    return this.nairaBalance + usdtInNaira;
});
exports.WalletSchema.virtual('totalBalanceUsdt').get(function () {
    const nairaInUsdt = this.nairaBalance / 1500;
    return this.usdtBalance + nairaInUsdt;
});
exports.WalletSchema.set('toJSON', { virtuals: true });
exports.WalletSchema.set('toObject', { virtuals: true });
//# sourceMappingURL=wallet.schema.js.map