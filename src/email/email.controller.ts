import { Controller, Post, Get, Body, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get email service status' })
  @ApiResponse({ status: 200, description: 'Email service status retrieved successfully' })
  async getEmailStatus() {
    return {
      activeProvider: this.emailService.getActiveProviderName(),
      fallbackProvider: this.emailService.getFallbackProviderName(),
      activeProviderConfigured: this.emailService.isActiveProviderConfigured(),
      fallbackProviderConfigured: this.emailService.isFallbackProviderConfigured(),
      availableTemplates: this.emailService.getAvailableTemplates(),
    };
  }

  @Post('test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a test email (Admin only)' })
  @ApiResponse({ status: 200, description: 'Test email sent successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async sendTestEmail(@Body() body: { to: string; template?: string }) {
    try {
      if (body.template) {
        await this.emailService.sendTemplateEmail(body.to, body.template, {
          userName: 'Test User',
          userEmail: body.to,
          dashboardUrl: 'http://localhost:3000/dashboard',
          // Add other template data as needed
        });
      } else {
        await this.emailService.sendEmail(
          body.to,
          'Test Email from KLT Mines',
          '<h1>Test Email</h1><p>This is a test email from the KLT Mines Investment Platform.</p>'
        );
      }

      return {
        success: true,
        message: 'Test email sent successfully',
        provider: this.emailService.getActiveProviderName(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send test email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('send-template')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send email using a specific template (Admin only)' })
  @ApiResponse({ status: 200, description: 'Template email sent successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async sendTemplateEmail(
    @Body() body: { 
      to: string; 
      template: string; 
      data: any;
      from?: { name: string; email: string };
    }
  ) {
    try {
      await this.emailService.sendTemplateEmail(
        body.to,
        body.template,
        body.data,
        body.from
      );

      return {
        success: true,
        message: `Template email (${body.template}) sent successfully`,
        provider: this.emailService.getActiveProviderName(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send template email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('send-custom')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a custom email (Admin only)' })
  @ApiResponse({ status: 200, description: 'Custom email sent successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async sendCustomEmail(
    @Body() body: { 
      to: string; 
      subject: string; 
      htmlContent: string;
      from?: { name: string; email: string };
    }
  ) {
    try {
      await this.emailService.sendEmail(
        body.to,
        body.subject,
        body.htmlContent,
        body.from
      );

      return {
        success: true,
        message: 'Custom email sent successfully',
        provider: this.emailService.getActiveProviderName(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send custom email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 