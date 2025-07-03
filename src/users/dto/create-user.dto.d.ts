import { Role } from '../enums/role.enum';
export declare class CreateUserDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    referralCode?: string;
    role?: Role;
}
