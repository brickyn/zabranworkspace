"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const targetBranch = await prisma.branch.findFirst({ where: { name: 'Laptop Murah Indonesia' } });
    if (!targetBranch)
        throw new Error("Branch not found");
    const models = client_1.Prisma.dmmf.datamodel.models;
    for (const model of models) {
        const hasBranchId = model.fields.some(f => f.name === 'branchId');
        if (hasBranchId && model.name !== 'Branch') {
            const modelNameStr = model.name.charAt(0).toLowerCase() + model.name.slice(1);
            try {
                // @ts-ignore
                await prisma[modelNameStr].updateMany({
                    data: { branchId: targetBranch.id }
                });
                console.log(`Updated branchId for ${model.name}`);
            }
            catch (e) {
                console.log(`Failed to update ${model.name}:`, e.message);
            }
        }
    }
    // Delete all other branches
    const deleteResult = await prisma.branch.deleteMany({
        where: { id: { not: targetBranch.id } }
    });
    console.log(`Deleted ${deleteResult.count} other branches.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=fix-branches-final.js.map