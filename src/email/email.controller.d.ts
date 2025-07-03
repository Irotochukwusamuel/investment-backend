import { EmailService } from './email.service';
export declare class EmailController {
    private readonly emailService;
    constructor(emailService: EmailService);
    getEmailStatus(): Promise<{
        activeProvider: string;
        fallbackProvider: string;
        activeProviderConfigured: boolean;
        fallbackProviderConfigured: boolean;
        availableTemplates: string[];
    }>;
    sendTestEmail(body: {
        to: string;
        template?: string;
    }): Promise<{
        success: boolean;
        message: string;
        provider: string;
    }>;
    sendTemplateEmail(body: {
        to: string;
        template: string;
        data: any;
        from?: {
            name: string;
            email: string;
        };
    }): Promise<{
        success: boolean;
        message: string;
        provider: string;
    }>;
    sendCustomEmail(body: {
        to: string;
        subject: string;
        htmlContent: string;
        from?: {
            name: string;
            email: string;
        };
    }): Promise<{
        success: boolean;
        message: string;
        provider: string;
    }>;
}
