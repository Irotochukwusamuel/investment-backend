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
exports.ConfirmationCodesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const confirmation_code_schema_1 = require("./schemas/confirmation-code.schema");
let ConfirmationCodesService = class ConfirmationCodesService {
    confirmationCodeModel;
    constructor(confirmationCodeModel) {
        this.confirmationCodeModel = confirmationCodeModel;
    }
    async generateCode(identifier, type, options) {
        const { expirationMinutes = 10, codeLength = 6, ipAddress, userAgent, metadata } = options || {};
        const code = this.generateRandomCode(codeLength);
        const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
        await this.invalidateExistingCodes(identifier, type);
        const confirmationCode = new this.confirmationCodeModel({
            identifier: identifier.toLowerCase(),
            code,
            type,
            expiresAt,
            attempts: 0,
            maxAttempts: 3,
            isUsed: false,
            ipAddress,
            userAgent,
            metadata,
        });
        await confirmationCode.save();
        return code;
    }
    async verifyCode(identifier, code, type) {
        const confirmationCode = await this.confirmationCodeModel.findOne({
            identifier: identifier.toLowerCase(),
            type,
            isUsed: false,
        }).sort({ createdAt: -1 });
        if (!confirmationCode) {
            throw new common_1.BadRequestException('Confirmation code not found or expired');
        }
        if (confirmationCode.expiresAt < new Date()) {
            await this.confirmationCodeModel.deleteOne({ _id: confirmationCode._id });
            throw new common_1.BadRequestException('Confirmation code has expired');
        }
        if (confirmationCode.attempts >= confirmationCode.maxAttempts) {
            await this.confirmationCodeModel.deleteOne({ _id: confirmationCode._id });
            throw new common_1.BadRequestException('Too many failed attempts');
        }
        confirmationCode.attempts += 1;
        await confirmationCode.save();
        if (confirmationCode.code !== code) {
            throw new common_1.BadRequestException('Invalid confirmation code');
        }
        confirmationCode.isUsed = true;
        await confirmationCode.save();
        return { valid: true, confirmationCode };
    }
    async canResendCode(identifier, type, cooldownMinutes = 1) {
        const recentCode = await this.confirmationCodeModel.findOne({
            identifier: identifier.toLowerCase(),
            type,
        }).sort({ createdAt: -1 });
        if (!recentCode) {
            return true;
        }
        const cooldownTime = new Date(Date.now() - cooldownMinutes * 60 * 1000);
        return recentCode.createdAt < cooldownTime;
    }
    async getCodeStats(identifier, type, hours = 24) {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);
        const matchStage = { createdAt: { $gte: since } };
        if (identifier)
            matchStage.identifier = identifier.toLowerCase();
        if (type)
            matchStage.type = type;
        const stats = await this.confirmationCodeModel.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalGenerated: { $sum: 1 },
                    totalVerified: { $sum: { $cond: ['$isUsed', 1, 0] } },
                    totalFailed: {
                        $sum: {
                            $cond: [
                                { $and: [{ $not: '$isUsed' }, { $gte: ['$attempts', '$maxAttempts'] }] },
                                1,
                                0
                            ]
                        }
                    },
                    averageAttempts: { $avg: '$attempts' }
                }
            }
        ]);
        return stats[0] || {
            totalGenerated: 0,
            totalVerified: 0,
            totalFailed: 0,
            averageAttempts: 0
        };
    }
    async cleanupExpiredCodes() {
        const result = await this.confirmationCodeModel.deleteMany({
            expiresAt: { $lt: new Date() }
        });
        return result.deletedCount;
    }
    generateRandomCode(length) {
        const min = Math.pow(10, length - 1);
        const max = Math.pow(10, length) - 1;
        return Math.floor(Math.random() * (max - min + 1) + min).toString();
    }
    async invalidateExistingCodes(identifier, type) {
        await this.confirmationCodeModel.updateMany({
            identifier: identifier.toLowerCase(),
            type,
            isUsed: false,
        }, {
            isUsed: true,
            metadata: { invalidatedAt: new Date(), reason: 'new_code_generated' }
        });
    }
};
exports.ConfirmationCodesService = ConfirmationCodesService;
exports.ConfirmationCodesService = ConfirmationCodesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(confirmation_code_schema_1.ConfirmationCode.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ConfirmationCodesService);
//# sourceMappingURL=confirmation-codes.service.js.map