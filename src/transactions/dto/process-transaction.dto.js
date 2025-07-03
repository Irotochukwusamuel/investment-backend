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
exports.ProcessTransactionDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const transaction_schema_1 = require("../schemas/transaction.schema");
class ProcessTransactionDto {
    status;
    reason;
}
exports.ProcessTransactionDto = ProcessTransactionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction status', enum: transaction_schema_1.TransactionStatus }),
    (0, class_validator_1.IsEnum)(transaction_schema_1.TransactionStatus),
    __metadata("design:type", String)
], ProcessTransactionDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Reason for status change', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProcessTransactionDto.prototype, "reason", void 0);
//# sourceMappingURL=process-transaction.dto.js.map