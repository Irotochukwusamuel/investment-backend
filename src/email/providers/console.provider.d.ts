import { ConfigService } from '@nestjs/config';
import { EmailProvider } from '../email-provider.interface';
export declare class ConsoleEmailProvider implements EmailProvider {
    private readonly configService;
    private readonly logger;
    private readonly isConfiguredFlag;
    constructor(configService: ConfigService);
    sendEmail(to: string, subject: string, htmlContent: string, from?: {
        name: string;
        email: string;
    }): Promise<void>;
    sendTemplateEmail(to: string, templateName: string, templateData: any, from?: {
        name: string;
        email: string;
    }): Promise<void>;
    isConfigured(): boolean;
    getProviderName(): string;
}
