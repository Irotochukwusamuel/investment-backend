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
exports.DepositDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const wallet_schema_1 = require("../schemas/wallet.schema");
class DepositDto {
    walletType;
    amount;
    currency;
    paymentMethod;
    paymentReference;
    description;
}
exports.DepositDto = DepositDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Wallet type', enum: wallet_schema_1.WalletType }),
    (0, class_validator_1.IsEnum)(wallet_schema_1.WalletType),
    __metadata("design:type", String)
], DepositDto.prototype, "walletType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deposit amount' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], DepositDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Currency', enum: ['naira', 'usdt'] }),
    (0, class_validator_1.IsEnum)(['naira', 'usdt']),
    __metadata("design:type", String)
], DepositDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Payment method', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DepositDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Payment reference', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DepositDto.prototype, "paymentReference", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deposit description', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DepositDto.prototype, "description", void 0);
//# sourceMappingURL=deposit.dto.js.map