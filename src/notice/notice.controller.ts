import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { NoticeService } from './notice.service';
import { Notice } from '../schemas/notice.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('notices')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  // Public: Get latest active notice
  @Get('active')
  async getActiveNotice(): Promise<Notice | null> {
    return this.noticeService.findActive();
  }

  // Admin: List all notices
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async findAll(): Promise<Notice[]> {
    return this.noticeService.findAll();
  }

  // Admin: Create notice
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  async create(@Body() data: Partial<Notice>): Promise<Notice> {
    return this.noticeService.create(data);
  }

  // Admin: Update notice
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: Partial<Notice>): Promise<Notice> {
    return this.noticeService.update(id, data);
  }

  // Admin: Delete notice
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.noticeService.remove(id);
  }
} 