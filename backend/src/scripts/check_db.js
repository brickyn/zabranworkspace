"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const users = await prisma.user.findMany();
    console.log('Users in DB:', users);
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check_db.js.map