"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const mongoose_1 = require("@nestjs/mongoose");
const app_controller_1 = require("./app.controller");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const investment_plans_module_1 = require("./investment-plans/investment-plans.module");
const investments_module_1 = require("./investments/investments.module");
const transactions_module_1 = require("./transactions/transactions.module");
const wallet_module_1 = require("./wallet/wallet.module");
const email_module_1 = require("./email/email.module");
const tasks_module_1 = require("./tasks/tasks.module");
const seeds_module_1 = require("./seeds/seeds.module");
const confirmation_codes_module_1 = require("./confirmation-codes/confirmation-codes.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            mongoose_1.MongooseModule.forRootAsync({
                useFactory: () => ({
                    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/kltmines',
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                }),
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            investment_plans_module_1.InvestmentPlansModule,
            investments_module_1.InvestmentsModule,
            transactions_module_1.TransactionsModule,
            wallet_module_1.WalletModule,
            email_module_1.EmailModule,
            tasks_module_1.TasksModule,
            seeds_module_1.SeedsModule,
            confirmation_codes_module_1.ConfirmationCodesModule,
        ],
        controllers: [app_controller_1.AppController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map