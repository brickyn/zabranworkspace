"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const branches = await prisma.branch.findMany();
    console.log("Branches:", branches);
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check-gudang.js.map