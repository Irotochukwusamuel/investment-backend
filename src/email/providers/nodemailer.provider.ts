import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailProvider } from '../email-provider.interface';
import { emailTemplates } from '../email-templates';

@Injectable()
export class NodemailerEmailProvider implements EmailProvider {
  private readonly logger = new Logger(NodemailerEmailProvider.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly senderEmail: string;
  private readonly senderName: string;
  private readonly isConfiguredFlag: boolean;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const secure = this.configService.get<boolean>('SMTP_SECURE', false);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    
    this.senderEmail = this.configService.get<string>('SMTP_SENDER_EMAIL', 'noreply@kltmines.com');
    this.senderName = this.configService.get<string>('SMTP_SENDER_NAME', 'KLT Mines Investment Platform');

    if (!host || !user || !pass) {
      this.logger.warn('SMTP configuration not found in environment variables');
      this.isConfiguredFlag = false;
      // Create a dummy transporter for development/testing
      this.transporter = nodemailer.createTransport({});
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });
      this.isConfiguredFlag = true;
      this.logger.log('Nodemailer email provider configured successfully');
    } catch (error) {
      this.logger.error('Failed to configure Nodemailer email provider:', error);
      this.isConfiguredFlag = false;
      this.transporter = nodemailer.createTransport({});
    }
  }

  async sendEmail(
    to: string, 
    subject: string, 
    htmlContent: string, 
    from?: { name: string; email: string }
  ): Promise<void> {
    if (!this.isConfiguredFlag) {
      this.logger.warn('Nodemailer email provider not configured, skipping email send');
      return;
    }

    try {
      const mailOptions = {
        from: `"${from?.name || this.senderName}" <${from?.email || this.senderEmail}>`,
        to,
        subject,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${to} via Nodemailer`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to} via Nodemailer:`, error);
      throw error;
    }
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
    return 'Nodemailer';
  }
} 