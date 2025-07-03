"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const investments_service_1 = require("./investments.service");
const investments_controller_1 = require("./investments.controller");
const investment_schema_1 = require("./schemas/investment.schema");
const investment_plan_schema_1 = require("../investment-plans/schemas/investment-plan.schema");
const wallet_module_1 = require("../wallet/wallet.module");
const users_module_1 = require("../users/users.module");
const transactions_module_1 = require("../transactions/transactions.module");
const email_module_1 = require("../email/email.module");
let InvestmentsModule = class InvestmentsModule {
};
exports.InvestmentsModule = InvestmentsModule;
exports.InvestmentsModule = InvestmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: investment_schema_1.Investment.name, schema: investment_schema_1.InvestmentSchema },
                { name: investment_plan_schema_1.InvestmentPlan.name, schema: investment_plan_schema_1.InvestmentPlanSchema },
            ]),
            wallet_module_1.WalletModule,
            users_module_1.UsersModule,
            transactions_module_1.TransactionsModule,
            email_module_1.EmailModule,
        ],
        controllers: [investments_controller_1.InvestmentsController],
        providers: [investments_service_1.InvestmentsService],
        exports: [investments_service_1.InvestmentsService],
    })
], InvestmentsModule);
//# sourceMappingURL=investments.module.js.map