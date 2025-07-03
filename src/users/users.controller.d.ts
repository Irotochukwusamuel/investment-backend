import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<User>;
    updateProfile(req: any, updateUserDto: UpdateUserDto): Promise<User>;
    create(createUserDto: CreateUserDto): Promise<User>;
    findAll(): Promise<User[]>;
    getStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        verifiedUsers: number;
        totalInvested: number;
        totalEarnings: number;
    }>;
    findOne(id: string): Promise<User>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<User>;
    remove(id: string): Promise<void>;
    verifyEmail(id: string): Promise<User>;
    resetPassword(id: string, body: {
        token: string;
        newPassword: string;
    }): Promise<void>;
}
