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
exports.InvestmentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const investments_service_1 = require("./investments.service");
const create_investment_request_dto_1 = require("./dto/create-investment-request.dto");
const update_investment_dto_1 = require("./dto/update-investment.dto");
const investment_schema_1 = require("./schemas/investment.schema");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let InvestmentsController = class InvestmentsController {
    investmentsService;
    constructor(investmentsService) {
        this.investmentsService = investmentsService;
    }
    async create(createInvestmentRequestDto, req) {
        return this.investmentsService.createFromRequest(createInvestmentRequestDto, req.user.id);
    }
    async findAll(query) {
        return this.investmentsService.findAll(query);
    }
    async findMyInvestments(query, req) {
        return this.investmentsService.findByUserId(req.user.id, query);
    }
    async getStats(userId) {
        return this.investmentsService.getInvestmentStats(userId);
    }
    async getActiveInvestments() {
        return this.investmentsService.getActiveInvestments();
    }
    async getInvestmentsByCurrency(currency) {
        return this.investmentsService.getInvestmentsByCurrency(currency);
    }
    async findOne(id) {
        return this.investmentsService.findOne(id);
    }
    async update(id, updateInvestmentDto) {
        return this.investmentsService.update(id, updateInvestmentDto);
    }
    async remove(id) {
        return this.investmentsService.remove(id);
    }
    async completeInvestment(id) {
        return this.investmentsService.completeInvestment(id);
    }
    async cancelInvestment(id, reason) {
        return this.investmentsService.cancelInvestment(id, reason);
    }
    async updateRoi(id, earnedAmount) {
        return this.investmentsService.updateRoi(id, earnedAmount);
    }
    async withdrawBonus(req) {
        return this.investmentsService.withdrawBonus(req.user.id);
    }
};
exports.InvestmentsController = InvestmentsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new investment' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Investment created successfully', type: investment_schema_1.Investment }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_investment_request_dto_1.CreateInvestmentRequestDto, Object]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all investments with optional filters' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Investments retrieved successfully', type: [investment_schema_1.Investment] }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, description: 'Filter by user ID' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by status' }),
    (0, swagger_1.ApiQuery)({ name: 'currency', required: false, description: 'Filter by currency' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Number of items per page' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user investments' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User investments retrieved successfully', type: [investment_schema_1.Investment] }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by status' }),
    (0, swagger_1.ApiQuery)({ name: 'currency', required: false, description: 'Filter by currency' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Number of items per page' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "findMyInvestments", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get investment statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Investment stats retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, description: 'Filter stats by user ID' }),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all active investments' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Active investments retrieved successfully', type: [investment_schema_1.Investment] }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "getActiveInvestments", null);
__decorate([
    (0, common_1.Get)('currency/:currency'),
    (0, swagger_1.ApiOperation)({ summary: 'Get investments by currency' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Investments by currency retrieved successfully', type: [investment_schema_1.Investment] }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('currency')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "getInvestmentsByCurrency", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get investment by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Investment retrieved successfully', type: investment_schema_1.Investment }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Investment not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update investment' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Investment updated successfully', type: investment_schema_1.Investment }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Investment not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_investment_dto_1.UpdateInvestmentDto]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete investment' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Investment deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Investment not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    (0, swagger_1.ApiOperation)({ summary: 'Complete investment' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Investment completed successfully', type: investment_schema_1.Investment }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Investment not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "completeInvestment", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel investment' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Investment cancelled successfully', type: investment_schema_1.Investment }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Investment not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "cancelInvestment", null);
__decorate([
    (0, common_1.Post)(':id/update-roi'),
    (0, swagger_1.ApiOperation)({ summary: 'Update investment ROI' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Investment ROI updated successfully', type: investment_schema_1.Investment }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Investment not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('earnedAmount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "updateRoi", null);
__decorate([
    (0, common_1.Post)('withdraw-bonus'),
    (0, swagger_1.ApiOperation)({ summary: 'Withdraw bonus (15-day rule applies)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bonus withdrawn successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cannot withdraw bonus yet' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "withdrawBonus", null);
exports.InvestmentsController = InvestmentsController = __decorate([
    (0, swagger_1.ApiTags)('investments'),
    (0, common_1.Controller)('investments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [investments_service_1.InvestmentsService])
], InvestmentsController);
//# sourceMappingURL=investments.controller.js.map