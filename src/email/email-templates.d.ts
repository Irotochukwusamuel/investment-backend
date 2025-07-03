export interface EmailTemplateData {
    [key: string]: any;
}
export interface EmailTemplate {
    subject: string;
    html: (data: EmailTemplateData) => string;
}
export declare const emailTemplates: Record<string, EmailTemplate>;
