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
exports.CreateInvestmentDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const investment_schema_1 = require("../schemas/investment.schema");
class CreateInvestmentDto {
    planId;
    amount;
    currency;
    dailyRoi;
    totalRoi;
    duration;
    startDate;
    endDate;
    expectedReturn;
    type;
    autoReinvest;
    nextRoiUpdate;
    welcomeBonus;
    referralBonus;
    transactionId;
    notes;
}
exports.CreateInvestmentDto = CreateInvestmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment plan ID' }),
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInvestmentDto.prototype, "planId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment amount' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateInvestmentDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment currency', enum: ['naira', 'usdt'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInvestmentDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Daily ROI percentage' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreateInvestmentDto.prototype, "dailyRoi", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total ROI percentage' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1000),
    __metadata("design:type", Number)
], CreateInvestmentDto.prototype, "totalRoi", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment duration in days' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateInvestmentDto.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment start date' }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Date)
], CreateInvestmentDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment end date' }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Date)
], CreateInvestmentDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total expected return' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateInvestmentDto.prototype, "expectedReturn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment type', enum: investment_schema_1.InvestmentType }),
    (0, class_validator_1.IsEnum)(investment_schema_1.InvestmentType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInvestmentDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Auto-reinvest enabled' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateInvestmentDto.prototype, "autoReinvest", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Next ROI update timestamp' }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Date)
], CreateInvestmentDto.prototype, "nextRoiUpdate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Welcome bonus amount' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateInvestmentDto.prototype, "welcomeBonus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Referral bonus amount' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateInvestmentDto.prototype, "referralBonus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction ID for the investment' }),
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInvestmentDto.prototype, "transactionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment notes' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInvestmentDto.prototype, "notes", void 0);
//# sourceMappingURL=create-investment.dto.js.map