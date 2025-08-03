import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EmailProvider } from '../email-provider.interface';
import { emailTemplates } from '../email-templates';

@Injectable()
export class ResendEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ResendEmailProvider.name);
  private readonly resend: Resend;
  private readonly senderEmail: string;
  private readonly senderName: string;
  private readonly isConfiguredFlag: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    // Use onboarding@resend.dev as default - this domain is pre-verified by Resend
    this.senderEmail = this.configService.get<string>('RESEND_SENDER_EMAIL', 'onboarding@resend.dev');
    this.senderName = this.configService.get<string>('RESEND_SENDER_NAME', 'KLTMINES Investment Platform');

    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not found in environment variables');
      this.isConfiguredFlag = false;
      // Create a dummy instance for development/testing
      this.resend = new Resend('dummy-key');
      return;
    }

    try {
      this.resend = new Resend(apiKey);
      this.isConfiguredFlag = true;
      this.logger.log('Resend email provider configured successfully');
      this.logger.log(`Using sender email: ${this.senderEmail}`);
    } catch (error) {
      this.logger.error('Failed to configure Resend email provider:', error);
      this.isConfiguredFlag = false;
      this.resend = new Resend('dummy-key');
    }
  }

  async sendEmail(
    to: string, 
    subject: string, 
    htmlContent: string, 
    from?: { name: string; email: string }
  ): Promise<void> {
    if (!this.isConfiguredFlag) {
      this.logger.warn('Resend email provider not configured, skipping email send');
      return;
    }

    try {
      const senderEmail = from?.email || this.senderEmail;
      const senderName = from?.name || this.senderName;
      
      // Validate that the sender email uses a verified domain
      if (senderEmail.includes('@kltmines.com') && !this.configService.get<boolean>('RESEND_DOMAIN_VERIFIED', false)) {
        this.logger.warn('kltmines.com domain not verified, using default Resend domain');
        // Use the default verified domain
        const defaultSender = `${senderName} <onboarding@resend.dev>`;
        
        const response = await this.resend.emails.send({
          from: defaultSender,
          to: [to],
          subject: subject,
          html: htmlContent,
          replyTo: senderEmail, // Set reply-to to your actual email
        });

        if (response.error) {
          throw new Error(`Resend API error: ${response.error.message}`);
        }

        this.logger.log(`Email sent successfully to ${to} via Resend (using default domain). Message ID: ${response.data?.id}`);
      } else {
        // Use the configured sender email directly
        const response = await this.resend.emails.send({
          from: `${senderName} <${senderEmail}>`,
          to: [to],
          subject: subject,
          html: htmlContent,
        });

        if (response.error) {
          throw new Error(`Resend API error: ${response.error.message}`);
        }

        this.logger.log(`Email sent successfully to ${to} via Resend. Message ID: ${response.data?.id}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${to} via Resend:`, error);
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
    return 'Resend';
  }
} 