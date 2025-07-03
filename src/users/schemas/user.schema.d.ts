import { Document, Types } from 'mongoose';
import { Role } from '../enums/role.enum';
export type UserDocument = User & Document;
export declare class User {
    _id: Types.ObjectId;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    role: Role;
    isActive: boolean;
    avatar?: string;
    totalInvested: number;
    totalEarnings: number;
    walletBalance: number;
    walletId?: Types.ObjectId;
    lastLoginAt?: Date;
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    loginAttempts: number;
    lockUntil?: Date;
    referralCode?: string;
    referredBy?: Types.ObjectId;
    referralCount: number;
    totalReferralEarnings: number;
    firstActiveInvestmentDate?: Date;
    lastBonusWithdrawalDate?: Date;
    totalBonusWithdrawals: number;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any> & User & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}> & import("mongoose").FlatRecord<User> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
