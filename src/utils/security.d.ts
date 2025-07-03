export declare class Security {
    static hashPassword(password: string): string;
    static comparePassword(password: string, hash: string): boolean;
}
