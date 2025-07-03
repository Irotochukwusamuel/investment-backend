import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InvestmentPlansService } from './investment-plans.service';
import { CreateInvestmentPlanDto } from './dto/create-investment-plan.dto';
import { UpdateInvestmentPlanDto } from './dto/update-investment-plan.dto';
import { InvestmentPlan } from './schemas/investment-plan.schema';
import { SeedsService } from '../seeds/seeds.service';

@ApiTags('plans')
@Controller('plans')
export class InvestmentPlansController {
  constructor(
    private readonly plansService: InvestmentPlansService,
    private readonly seedsService: SeedsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create investment plan' })
  @ApiResponse({ status: 201, description: 'Plan created', type: InvestmentPlan })
  async create(@Body() dto: CreateInvestmentPlanDto): Promise<InvestmentPlan> {
    return this.plansService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all investment plans' })
  @ApiResponse({ status: 200, description: 'List of plans', type: [InvestmentPlan] })
  async findAll(): Promise<InvestmentPlan[]> {
    return this.plansService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan by ID' })
  @ApiResponse({ status: 200, description: 'Plan found', type: InvestmentPlan })
  async findOne(@Param('id') id: string): Promise<InvestmentPlan> {
    return this.plansService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update plan' })
  @ApiResponse({ status: 200, description: 'Plan updated', type: InvestmentPlan })
  async update(@Param('id') id: string, @Body() dto: UpdateInvestmentPlanDto): Promise<InvestmentPlan> {
    return this.plansService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete plan' })
  @ApiResponse({ status: 204, description: 'Plan deleted' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.plansService.remove(id);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed default investment plans' })
  @ApiResponse({ status: 200, description: 'Plans seeded successfully' })
  async seed(): Promise<{ message: string }> {
    await this.seedsService.seedInvestmentPlans();
    return { message: 'Investment plans seeded successfully' };
  }
} 