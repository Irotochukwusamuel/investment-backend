import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InvestmentPlan, InvestmentPlanDocument } from './schemas/investment-plan.schema';
import { CreateInvestmentPlanDto } from './dto/create-investment-plan.dto';
import { UpdateInvestmentPlanDto } from './dto/update-investment-plan.dto';

@Injectable()
export class InvestmentPlansService {
  constructor(
    @InjectModel(InvestmentPlan.name) private planModel: Model<InvestmentPlanDocument>,
  ) {}

  async create(createDto: CreateInvestmentPlanDto): Promise<InvestmentPlan> {
    const exists = await this.planModel.findOne({ name: createDto.name });
    if (exists) throw new ConflictException('Plan with this name already exists');
    const plan = new this.planModel(createDto);
    return plan.save();
  }

  async findAll(): Promise<InvestmentPlan[]> {
    return this.planModel.find().exec();
  }

  async findById(id: string): Promise<InvestmentPlan> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid plan ID');
    const plan = await this.planModel.findById(id).exec();
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async update(id: string, updateDto: UpdateInvestmentPlanDto): Promise<InvestmentPlan> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid plan ID');
    const plan = await this.planModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid plan ID');
    const plan = await this.planModel.findById(id);
    if (!plan) throw new NotFoundException('Plan not found');
    await this.planModel.findByIdAndDelete(id);
  }
} 