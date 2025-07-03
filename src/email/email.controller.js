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
exports.EmailController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const email_service_1 = require("./email.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let EmailController = class EmailController {
    emailService;
    constructor(emailService) {
        this.emailService = emailService;
    }
    async getEmailStatus() {
        return {
            activeProvider: this.emailService.getActiveProviderName(),
            fallbackProvider: this.emailService.getFallbackProviderName(),
            activeProviderConfigured: this.emailService.isActiveProviderConfigured(),
            fallbackProviderConfigured: this.emailService.isFallbackProviderConfigured(),
            availableTemplates: this.emailService.getAvailableTemplates(),
        };
    }
    async sendTestEmail(body) {
        try {
            if (body.template) {
                await this.emailService.sendTemplateEmail(body.to, body.template, {
                    userName: 'Test User',
                    userEmail: body.to,
                    dashboardUrl: 'http://localhost:3000/dashboard',
                });
            }
            else {
                await this.emailService.sendEmail(body.to, 'Test Email from KLT Mines', '<h1>Test Email</h1><p>This is a test email from the KLT Mines Investment Platform.</p>');
            }
            return {
                success: true,
                message: 'Test email sent successfully',
                provider: this.emailService.getActiveProviderName(),
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to send test email',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async sendTemplateEmail(body) {
        try {
            await this.emailService.sendTemplateEmail(body.to, body.template, body.data, body.from);
            return {
                success: true,
                message: `Template email (${body.template}) sent successfully`,
                provider: this.emailService.getActiveProviderName(),
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to send template email',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async sendCustomEmail(body) {
        try {
            await this.emailService.sendEmail(body.to, body.subject, body.htmlContent, body.from);
            return {
                success: true,
                message: 'Custom email sent successfully',
                provider: this.emailService.getActiveProviderName(),
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to send custom email',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.EmailController = EmailController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get email service status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email service status retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "getEmailStatus", null);
__decorate([
    (0, common_1.Post)('test'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Send a test email (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Test email sent successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin access required' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "sendTestEmail", null);
__decorate([
    (0, common_1.Post)('send-template'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Send email using a specific template (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Template email sent successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin access required' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "sendTemplateEmail", null);
__decorate([
    (0, common_1.Post)('send-custom'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Send a custom email (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Custom email sent successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin access required' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "sendCustomEmail", null);
exports.EmailController = EmailController = __decorate([
    (0, swagger_1.ApiTags)('Email'),
    (0, common_1.Controller)('email'),
    __metadata("design:paramtypes", [email_service_1.EmailService])
], EmailController);
//# sourceMappingURL=email.controller.js.map