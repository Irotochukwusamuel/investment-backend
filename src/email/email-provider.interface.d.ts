export interface EmailProvider {
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
export interface EmailConfig {
    provider: 'brevo' | 'nodemailer' | 'console';
    brevo?: {
        apiKey: string;
        senderEmail: string;
        senderName: string;
    };
    nodemailer?: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
        senderEmail: string;
        senderName: string;
    };
    console?: {
        enabled: boolean;
    };
}
