"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const users = await prisma.user.findMany({ select: { branchId: true } });
    const uniqueBranchIds = [...new Set(users.map(u => u.branchId))];
    console.log("Branches in use by users:", uniqueBranchIds);
    const branches = await prisma.branch.findMany();
    console.log("All branches:", branches.map(b => ({ id: b.id, name: b.name })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=fix-branches.js.map