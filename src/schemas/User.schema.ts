import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class User {

    @Prop({ required: true, unique: true })
    email: string;

    @Prop()
    fullName: string;

    @Prop({ required: false })
    referralCode: string;

    @Prop({ required: true })
    password: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;
    
    @Prop({ default: false })
    isAdmin: boolean;

    @Prop({ default: false })
    isEmailVerified: boolean;

    @Prop({ required: false })
    deactivatedAt?: Date;

    @Prop({ required: false })
    deactivatedReason?: string;

    @Prop({ required: false })
    password_reset_token?: string;

    @Prop({ required: false })
    password_reset_token_expiry?: Date;

}

export const UserSchema = SchemaFactory.createForClass(User);