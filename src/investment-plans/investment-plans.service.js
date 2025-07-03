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
exports.InvestmentPlansService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const investment_plan_schema_1 = require("./schemas/investment-plan.schema");
let InvestmentPlansService = class InvestmentPlansService {
    planModel;
    constructor(planModel) {
        this.planModel = planModel;
    }
    async create(createDto) {
        const exists = await this.planModel.findOne({ name: createDto.name });
        if (exists)
            throw new common_1.ConflictException('Plan with this name already exists');
        const plan = new this.planModel(createDto);
        return plan.save();
    }
    async findAll() {
        return this.planModel.find().exec();
    }
    async findById(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id))
            throw new common_1.BadRequestException('Invalid plan ID');
        const plan = await this.planModel.findById(id).exec();
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        return plan;
    }
    async update(id, updateDto) {
        if (!mongoose_2.Types.ObjectId.isValid(id))
            throw new common_1.BadRequestException('Invalid plan ID');
        const plan = await this.planModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        return plan;
    }
    async remove(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id))
            throw new common_1.BadRequestException('Invalid plan ID');
        const plan = await this.planModel.findById(id);
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        await this.planModel.findByIdAndDelete(id);
    }
};
exports.InvestmentPlansService = InvestmentPlansService;
exports.InvestmentPlansService = InvestmentPlansService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(investment_plan_schema_1.InvestmentPlan.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], InvestmentPlansService);
//# sourceMappingURL=investment-plans.service.js.map