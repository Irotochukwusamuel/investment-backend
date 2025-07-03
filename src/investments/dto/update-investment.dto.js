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
exports.UpdateInvestmentDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const create_investment_dto_1 = require("./create-investment.dto");
const investment_schema_1 = require("../schemas/investment.schema");
class UpdateInvestmentDto extends (0, swagger_1.PartialType)(create_investment_dto_1.CreateInvestmentDto) {
    status;
    earnedAmount;
    lastRoiUpdate;
    type;
    autoReinvest;
    welcomeBonus;
    referralBonus;
    transactionId;
    notes;
}
exports.UpdateInvestmentDto = UpdateInvestmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment status', enum: investment_schema_1.InvestmentStatus, required: false }),
    (0, class_validator_1.IsEnum)(investment_schema_1.InvestmentStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateInvestmentDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current earned amount', required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateInvestmentDto.prototype, "earnedAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last ROI update timestamp', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], UpdateInvestmentDto.prototype, "lastRoiUpdate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment type', enum: investment_schema_1.InvestmentType, required: false }),
    (0, class_validator_1.IsEnum)(investment_schema_1.InvestmentType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateInvestmentDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Auto-reinvest enabled', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateInvestmentDto.prototype, "autoReinvest", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Welcome bonus amount', required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateInvestmentDto.prototype, "welcomeBonus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Referral bonus amount', required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateInvestmentDto.prototype, "referralBonus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction ID for the investment', required: false }),
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateInvestmentDto.prototype, "transactionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Investment notes', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateInvestmentDto.prototype, "notes", void 0);
//# sourceMappingURL=update-investment.dto.js.map