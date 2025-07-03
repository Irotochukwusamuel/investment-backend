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
exports.InvestmentPlansController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const investment_plans_service_1 = require("./investment-plans.service");
const create_investment_plan_dto_1 = require("./dto/create-investment-plan.dto");
const update_investment_plan_dto_1 = require("./dto/update-investment-plan.dto");
const investment_plan_schema_1 = require("./schemas/investment-plan.schema");
const seeds_service_1 = require("../seeds/seeds.service");
let InvestmentPlansController = class InvestmentPlansController {
    plansService;
    seedsService;
    constructor(plansService, seedsService) {
        this.plansService = plansService;
        this.seedsService = seedsService;
    }
    async create(dto) {
        return this.plansService.create(dto);
    }
    async findAll() {
        return this.plansService.findAll();
    }
    async findOne(id) {
        return this.plansService.findById(id);
    }
    async update(id, dto) {
        return this.plansService.update(id, dto);
    }
    async remove(id) {
        return this.plansService.remove(id);
    }
    async seed() {
        await this.seedsService.seedInvestmentPlans();
        return { message: 'Investment plans seeded successfully' };
    }
};
exports.InvestmentPlansController = InvestmentPlansController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create investment plan' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Plan created', type: investment_plan_schema_1.InvestmentPlan }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_investment_plan_dto_1.CreateInvestmentPlanDto]),
    __metadata("design:returntype", Promise)
], InvestmentPlansController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all investment plans' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of plans', type: [investment_plan_schema_1.InvestmentPlan] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InvestmentPlansController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get plan by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plan found', type: investment_plan_schema_1.InvestmentPlan }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentPlansController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update plan' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plan updated', type: investment_plan_schema_1.InvestmentPlan }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_investment_plan_dto_1.UpdateInvestmentPlanDto]),
    __metadata("design:returntype", Promise)
], InvestmentPlansController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete plan' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Plan deleted' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentPlansController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('seed'),
    (0, swagger_1.ApiOperation)({ summary: 'Seed default investment plans' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plans seeded successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InvestmentPlansController.prototype, "seed", null);
exports.InvestmentPlansController = InvestmentPlansController = __decorate([
    (0, swagger_1.ApiTags)('plans'),
    (0, common_1.Controller)('plans'),
    __metadata("design:paramtypes", [investment_plans_service_1.InvestmentPlansService,
        seeds_service_1.SeedsService])
], InvestmentPlansController);
//# sourceMappingURL=investment-plans.controller.js.map