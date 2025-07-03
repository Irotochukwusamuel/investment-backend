
import * as bcrypt from 'bcrypt';
import { User } from 'src/schemas/User.schema';

export class Security {

    static hashPassword(password: string): string {
        return bcrypt.hashSync(password, 10);
    }

    static comparePassword(password: string, hash: string): boolean {
        return bcrypt.compareSync(password, hash);
    }


}