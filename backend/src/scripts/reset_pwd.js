"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const email = 'admin@zabran.com';
    const newPassword = 'password123';
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
    await prisma.user.upsert({
        where: { email },
        update: { password: hashedPassword, role: 'Super Admin', isActive: true },
        create: {
            id: 'USR-999',
            email,
            name: 'Super Admin',
            password: hashedPassword,
            role: 'Super Admin',
            isActive: true
        }
    });
    console.log(`Password for ${email} reset to: ${newPassword}`);
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=reset_pwd.js.map