"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const hashedPassword = await bcryptjs_1.default.hash('Zabran2026!', 10);
    await prisma.user.update({
        where: { email: 'superadmin@zabran.com' },
        data: { password: hashedPassword }
    });
    console.log('Password reset successfully for superadmin@zabran.com');
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check-admin.js.map