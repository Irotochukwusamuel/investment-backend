import { Document } from 'mongoose';
export type ConfirmationCodeDocument = ConfirmationCode & Document;
export declare class ConfirmationCode {
    identifier: string;
    code: string;
    type: 'email_verification' | 'password_reset' | 'login' | 'phone_verification';
    expiresAt: Date;
    attempts: number;
    maxAttempts: number;
    isUsed: boolean;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ConfirmationCodeSchema: import("mongoose").Schema<ConfirmationCode, import("mongoose").Model<ConfirmationCode, any, any, any, Document<unknown, any, ConfirmationCode, any> & ConfirmationCode & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ConfirmationCode, Document<unknown, {}, import("mongoose").FlatRecord<ConfirmationCode>, {}> & import("mongoose").FlatRecord<ConfirmationCode> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
