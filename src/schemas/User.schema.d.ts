export declare class User {
    email: string;
    fullName: string;
    referralCode: string;
    password: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    isAdmin: boolean;
    isEmailVerified: boolean;
    deactivatedAt?: Date;
    deactivatedReason?: string;
    password_reset_token?: string;
    password_reset_token_expiry?: Date;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, import("mongoose").Document<unknown, any, User, any> & User & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<User>, {}> & import("mongoose").FlatRecord<User> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
