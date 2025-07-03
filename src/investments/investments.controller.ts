import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InvestmentsService } from './investments.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { CreateInvestmentRequestDto } from './dto/create-investment-request.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { Investment } from './schemas/investment.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('investments')
@Controller('investments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new investment' })
  @ApiResponse({ status: 201, description: 'Investment created successfully', type: Investment })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createInvestmentRequestDto: CreateInvestmentRequestDto,
    @Request() req: any,
  ): Promise<Investment> {
    return this.investmentsService.createFromRequest(createInvestmentRequestDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all investments with optional filters' })
  @ApiResponse({ status: 200, description: 'Investments retrieved successfully', type: [Investment] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'currency', required: false, description: 'Filter by currency' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  async findAll(@Query() query: any): Promise<Investment[]> {
    return this.investmentsService.findAll(query);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user investments' })
  @ApiResponse({ status: 200, description: 'User investments retrieved successfully', type: [Investment] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'currency', required: false, description: 'Filter by currency' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  async findMyInvestments(
    @Query() query: any,
    @Request() req: any,
  ): Promise<Investment[]> {
    return this.investmentsService.findByUserId(req.user.id, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get investment statistics' })
  @ApiResponse({ status: 200, description: 'Investment stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter stats by user ID' })
  async getStats(@Query('userId') userId?: string): Promise<any> {
    return this.investmentsService.getInvestmentStats(userId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active investments' })
  @ApiResponse({ status: 200, description: 'Active investments retrieved successfully', type: [Investment] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getActiveInvestments(): Promise<Investment[]> {
    return this.investmentsService.getActiveInvestments();
  }

  @Get('currency/:currency')
  @ApiOperation({ summary: 'Get investments by currency' })
  @ApiResponse({ status: 200, description: 'Investments by currency retrieved successfully', type: [Investment] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getInvestmentsByCurrency(@Param('currency') currency: string): Promise<Investment[]> {
    return this.investmentsService.getInvestmentsByCurrency(currency);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get investment by ID' })
  @ApiResponse({ status: 200, description: 'Investment retrieved successfully', type: Investment })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string): Promise<Investment> {
    return this.investmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update investment' })
  @ApiResponse({ status: 200, description: 'Investment updated successfully', type: Investment })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body() updateInvestmentDto: UpdateInvestmentDto,
  ): Promise<Investment> {
    return this.investmentsService.update(id, updateInvestmentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete investment' })
  @ApiResponse({ status: 204, description: 'Investment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.investmentsService.remove(id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete investment' })
  @ApiResponse({ status: 200, description: 'Investment completed successfully', type: Investment })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async completeInvestment(@Param('id') id: string): Promise<Investment> {
    return this.investmentsService.completeInvestment(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel investment' })
  @ApiResponse({ status: 200, description: 'Investment cancelled successfully', type: Investment })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancelInvestment(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ): Promise<Investment> {
    return this.investmentsService.cancelInvestment(id, reason);
  }

  @Post(':id/update-roi')
  @ApiOperation({ summary: 'Update investment ROI' })
  @ApiResponse({ status: 200, description: 'Investment ROI updated successfully', type: Investment })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateRoi(
    @Param('id') id: string,
    @Body('earnedAmount') earnedAmount: number,
  ): Promise<Investment> {
    return this.investmentsService.updateRoi(id, earnedAmount);
  }

  @Post('withdraw-bonus')
  @ApiOperation({ summary: 'Withdraw bonus (15-day rule applies)' })
  @ApiResponse({ status: 200, description: 'Bonus withdrawn successfully' })
  @ApiResponse({ status: 400, description: 'Cannot withdraw bonus yet' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async withdrawBonus(@Request() req: any): Promise<{ success: boolean; message: string; amount?: number }> {
    return this.investmentsService.withdrawBonus(req.user.id);
  }
} 