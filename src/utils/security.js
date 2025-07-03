"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Security = void 0;
const bcrypt = require("bcrypt");
class Security {
    static hashPassword(password) {
        return bcrypt.hashSync(password, 10);
    }
    static comparePassword(password, hash) {
        return bcrypt.compareSync(password, hash);
    }
}
exports.Security = Security;
//# sourceMappingURL=security.js.map