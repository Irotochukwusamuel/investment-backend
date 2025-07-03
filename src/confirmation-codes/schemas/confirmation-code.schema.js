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
exports.ConfirmationCodeSchema = exports.ConfirmationCode = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const swagger_1 = require("@nestjs/swagger");
let ConfirmationCode = class ConfirmationCode {
    identifier;
    code;
    type;
    expiresAt;
    attempts;
    maxAttempts;
    isUsed;
    ipAddress;
    userAgent;
    metadata;
    createdAt;
    updatedAt;
};
exports.ConfirmationCode = ConfirmationCode;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Email or phone number' }),
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], ConfirmationCode.prototype, "identifier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The OTP code' }),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ConfirmationCode.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type of confirmation', enum: ['email_verification', 'password_reset', 'login', 'phone_verification'] }),
    (0, mongoose_1.Prop)({ required: true, enum: ['email_verification', 'password_reset', 'login', 'phone_verification'] }),
    __metadata("design:type", String)
], ConfirmationCode.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Expiration date' }),
    (0, mongoose_1.Prop)({ required: true, index: { expireAfterSeconds: 0 } }),
    __metadata("design:type", Date)
], ConfirmationCode.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of verification attempts' }),
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ConfirmationCode.prototype, "attempts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Maximum allowed attempts' }),
    (0, mongoose_1.Prop)({ default: 3 }),
    __metadata("design:type", Number)
], ConfirmationCode.prototype, "maxAttempts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the code has been used' }),
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], ConfirmationCode.prototype, "isUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'IP address of the requester' }),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ConfirmationCode.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User agent of the requester' }),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ConfirmationCode.prototype, "userAgent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Additional metadata' }),
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], ConfirmationCode.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Creation timestamp' }),
    __metadata("design:type", Date)
], ConfirmationCode.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last update timestamp' }),
    __metadata("design:type", Date)
], ConfirmationCode.prototype, "updatedAt", void 0);
exports.ConfirmationCode = ConfirmationCode = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], ConfirmationCode);
exports.ConfirmationCodeSchema = mongoose_1.SchemaFactory.createForClass(ConfirmationCode);
exports.ConfirmationCodeSchema.index({ identifier: 1, type: 1, isUsed: 1 });
exports.ConfirmationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
//# sourceMappingURL=confirmation-code.schema.js.map