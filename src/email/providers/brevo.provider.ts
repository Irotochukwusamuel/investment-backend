import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SibApiV3Sdk from '@sendinblue/client';
import { EmailProvider } from '../email-provider.interface';
import { emailTemplates } from '../email-templates';

@Injectable()
export class BrevoEmailProvider implements EmailProvider {
  private readonly logger = new Logger(BrevoEmailProvider.name);
  private readonly apiInstance: SibApiV3Sdk.TransactionalEmailsApi;
  private readonly senderEmail: string;
  private readonly senderName: string;
  private readonly isConfiguredFlag: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    this.senderEmail = this.configService.get<string>('BREVO_SENDER_EMAIL', 'noreply@kltmines.com');
    this.senderName = this.configService.get<string>('BREVO_SENDER_NAME', 'KLT Mines Investment Platform');

    if (!apiKey) {
      this.logger.warn('BREVO_API_KEY not found in environment variables');
      this.isConfiguredFlag = false;
      // Create a dummy instance for development/testing
      this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      return;
    }

    try {
      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, apiKey);
      this.apiInstance = apiInstance;
      this.isConfiguredFlag = true;
      this.logger.log('Brevo email provider configured successfully');
    } catch (error) {
      this.logger.error('Failed to configure Brevo email provider:', error);
      this.isConfiguredFlag = false;
      this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    }
  }

  async sendEmail(
    to: string, 
    subject: string, 
    htmlContent: string, 
    from?: { name: string; email: string }
  ): Promise<void> {
    if (!this.isConfiguredFlag) {
      this.logger.warn('Brevo email provider not configured, skipping email send');
      return;
    }

    try {
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlContent;
      sendSmtpEmail.sender = { 
        name: from?.name || this.senderName, 
        email: from?.email || this.senderEmail 
      };
      sendSmtpEmail.to = [{ email: to }];

      const response = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      this.logger.log(`Email sent successfully to ${to} via Brevo. Message ID: ${response.body?.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to} via Brevo:`, error);
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
    return 'Brevo';
  }
} 