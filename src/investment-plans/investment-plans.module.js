"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentPlansModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const investment_plan_schema_1 = require("./schemas/investment-plan.schema");
const investment_plans_service_1 = require("./investment-plans.service");
const investment_plans_controller_1 = require("./investment-plans.controller");
const seeds_module_1 = require("../seeds/seeds.module");
let InvestmentPlansModule = class InvestmentPlansModule {
};
exports.InvestmentPlansModule = InvestmentPlansModule;
exports.InvestmentPlansModule = InvestmentPlansModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: investment_plan_schema_1.InvestmentPlan.name, schema: investment_plan_schema_1.InvestmentPlanSchema },
            ]),
            seeds_module_1.SeedsModule,
        ],
        controllers: [investment_plans_controller_1.InvestmentPlansController],
        providers: [investment_plans_service_1.InvestmentPlansService],
        exports: [investment_plans_service_1.InvestmentPlansService],
    })
], InvestmentPlansModule);
//# sourceMappingURL=investment-plans.module.js.map