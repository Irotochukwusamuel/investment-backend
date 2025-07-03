import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailProvider } from '../email-provider.interface';
import { emailTemplates } from '../email-templates';

@Injectable()
export class ConsoleEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ConsoleEmailProvider.name);
  private readonly isConfiguredFlag: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isConfiguredFlag = this.configService.get<boolean>('CONSOLE_EMAIL_ENABLED', true);
    if (this.isConfiguredFlag) {
      this.logger.log('Console email provider enabled for development/testing');
    }
  }

  async sendEmail(
    to: string, 
    subject: string, 
    htmlContent: string, 
    from?: { name: string; email: string }
  ): Promise<void> {
    if (!this.isConfiguredFlag) {
      this.logger.warn('Console email provider not enabled, skipping email send');
      return;
    }

    this.logger.log('=== CONSOLE EMAIL ===');
    this.logger.log(`From: ${from?.name || 'KLT Mines'} <${from?.email || 'noreply@kltmines.com'}>`);
    this.logger.log(`To: ${to}`);
    this.logger.log(`Subject: ${subject}`);
    this.logger.log('Content:');
    this.logger.log(htmlContent);
    this.logger.log('=== END CONSOLE EMAIL ===');
  }

  async sendTemplateEmail(
    to: string, 
    templateName: string, 
    templateData: any, 
    from?: { name: string; email: string }
  ): Promise<void> {
    const template = emailTemplates[templateName];
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const subject = template.subject.replace(/\${(\w+)}/g, (match, key) => {
      return templateData[key] || match;
    });
    
    const htmlContent = template.html(templateData);

    await this.sendEmail(to, subject, htmlContent, from);
  }

  isConfigured(): boolean {
    return this.isConfiguredFlag;
  }

  getProviderName(): string {
    return 'Console';
  }
} 