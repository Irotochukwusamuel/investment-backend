import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notice, NoticeDocument } from '../schemas/notice.schema';

@Injectable()
export class NoticeService {
  constructor(
    @InjectModel(Notice.name) private noticeModel: Model<NoticeDocument>,
  ) {}

  async create(data: Partial<Notice>): Promise<Notice> {
    return this.noticeModel.create(data);
  }

  async findAll(): Promise<Notice[]> {
    return this.noticeModel.find().sort({ createdAt: -1 }).exec();
  }

  async findActive(): Promise<Notice | null> {
    return this.noticeModel.findOne({ isActive: true }).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Notice> {
    const notice = await this.noticeModel.findById(id).exec();
    if (!notice) throw new NotFoundException('Notice not found');
    return notice;
  }

  async update(id: string, data: Partial<Notice>): Promise<Notice> {
    const notice = await this.noticeModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!notice) throw new NotFoundException('Notice not found');
    return notice;
  }

  async remove(id: string): Promise<void> {
    const result = await this.noticeModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Notice not found');
  }
} 