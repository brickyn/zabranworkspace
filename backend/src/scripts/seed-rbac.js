"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const permissionsData = [
    // Dashboard & General
    { action: 'Dashboard.View', module: 'General', description: 'View main dashboard' },
    { action: 'Reports.View', module: 'General', description: 'View reports' },
    { action: 'Reports.Export', module: 'General', description: 'Export reports' },
    { action: 'AuditLog.View', module: 'General', description: 'View audit logs' },
    // Inventory
    { action: 'Inventory.View', module: 'Inventory', description: 'View inventory' },
    { action: 'Inventory.Create', module: 'Inventory', description: 'Create product' },
    { action: 'Inventory.Edit', module: 'Inventory', description: 'Edit product' },
    { action: 'Inventory.Delete', module: 'Inventory', description: 'Delete product' },
    { action: 'Inventory.Transfer', module: 'Inventory', description: 'Create transfer' },
    { action: 'Inventory.ApproveTransfer', module: 'Inventory', description: 'Approve transfer' },
    { action: 'Inventory.Receive', module: 'Inventory', description: 'Receive transfer' },
    { action: 'Inventory.Adjustment', module: 'Inventory', description: 'Adjust stock' },
    { action: 'Inventory.StockOpname', module: 'Inventory', description: 'Perform stock opname' },
    { action: 'Inventory.Return', module: 'Inventory', description: 'Return stock' },
    // POS
    { action: 'POS.View', module: 'POS', description: 'View POS history' },
    { action: 'POS.Create', module: 'POS', description: 'Make transaction' },
    { action: 'POS.PrintReceipt', module: 'POS', description: 'Print receipt' },
    { action: 'POS.Refund', module: 'POS', description: 'Refund transaction' },
    { action: 'POS.Void', module: 'POS', description: 'Void transaction' },
    { action: 'POS.OverridePrice', module: 'POS', description: 'Override price' },
    { action: 'POS.ApplyDiscount', module: 'POS', description: 'Apply discount' },
    // Purchase
    { action: 'Purchase.View', module: 'Purchase', description: 'View POs' },
    { action: 'Purchase.Create', module: 'Purchase', description: 'Create PO' },
    { action: 'Purchase.Approve', module: 'Purchase', description: 'Approve PO' },
    // System
    { action: 'User.Manage', module: 'System', description: 'Manage users' },
    { action: 'Role.Manage', module: 'System', description: 'Manage roles' },
    { action: 'Permission.Manage', module: 'System', description: 'Manage permissions' },
    { action: 'System.Settings', module: 'System', description: 'System settings' },
    // Finance
    { action: 'Finance.View', module: 'Finance', description: 'View finance' },
    { action: 'Finance.Export', module: 'Finance', description: 'Export finance' },
    // Service Center
    { action: 'Service.View', module: 'Service', description: 'View service jobs' },
    { action: 'Service.Manage', module: 'Service', description: 'Manage service jobs' },
    // CRM
    { action: 'CRM.View', module: 'CRM', description: 'View CRM data' },
    { action: 'CRM.Manage', module: 'CRM', description: 'Manage CRM' }
];
// Helper to get array of permissions
const allPerms = permissionsData.map(p => p.action);
const getPerms = (includes, excludes = []) => {
    return allPerms.filter(p => {
        return includes.some(inc => p.startsWith(inc) || p === inc) &&
            !excludes.some(exc => p.startsWith(exc) || p === exc);
    });
};
const rolesData = [
    {
        name: 'Owner',
        description: 'Full system visibility, no operational transactions',
        isSystem: true,
        permissions: getPerms(['Dashboard.View', 'Reports.', 'AuditLog.View', 'User.', 'Role.', 'Permission.', 'System.', 'Inventory.View', 'POS.View', 'Purchase.View', 'Finance.View', 'CRM.View', 'Service.View'])
    },
    {
        name: 'Super Admin',
        description: 'System Administrator (Legacy)',
        isSystem: true,
        permissions: allPerms
    },
    {
        name: 'IT Administrator',
        description: 'Manage users, system, and logs',
        isSystem: true,
        permissions: getPerms(['User.', 'Role.', 'Permission.', 'System.', 'AuditLog.View', 'Dashboard.View'])
    },
    {
        name: 'Director',
        description: 'View dashboards, reports, and approve high-level workflows',
        isSystem: true,
        permissions: getPerms(['Dashboard.View', 'Reports.', 'Inventory.View', 'Finance.', 'Purchase.Approve', 'POS.View', 'CRM.View'])
    },
    {
        name: 'Management',
        description: 'Management (Legacy mapping)',
        isSystem: true,
        permissions: getPerms(['Dashboard.View', 'Reports.', 'Inventory.', 'Finance.', 'Purchase.', 'POS.View', 'CRM.View'])
    },
    {
        name: 'Manager', // Equivalent to GM / Area Manager loosely
        description: 'General Manager (Legacy)',
        isSystem: true,
        permissions: getPerms(['Dashboard.View', 'Reports.', 'Inventory.', 'POS.View', 'Purchase.', 'CRM.View'])
    },
    {
        name: 'General Manager',
        description: 'Manage operational approvals, monitor all branches',
        isSystem: true,
        permissions: getPerms(['Dashboard.View', 'Reports.', 'Inventory.', 'POS.View', 'Purchase.', 'CRM.View'], ['Inventory.Delete'])
    },
    {
        name: 'Area Manager',
        description: 'Monitor assigned branches, view inventory & POS reports',
        isSystem: true,
        permissions: getPerms(['Dashboard.View', 'Reports.', 'Inventory.View', 'Inventory.ApproveTransfer', 'POS.View', 'CRM.View'])
    },
    {
        name: 'Warehouse', // Legacy mapping
        description: 'Warehouse Manager (Legacy)',
        isSystem: true,
        permissions: getPerms(['Dashboard.View', 'Inventory.View', 'Inventory.Transfer', 'Inventory.ApproveTransfer', 'Inventory.Receive', 'Inventory.StockOpname'])
    },
    {
        name: 'Warehouse Supervisor',
        description: 'Manage inventory, approve transfers, dispatch',
        isSystem: true,
        permissions: getPerms(['Dashboard.View', 'Inventory.View', 'Inventory.Transfer', 'Inventory.ApproveTransfer', 'Inventory.Receive', 'Inventory.StockOpname', 'Inventory.Adjustment', 'Reports.View'])
    },
    {
        name: 'Warehouse Staff',
        description: 'Picking, packing, dispatch, goods receiving',
        isSystem: true,
        permissions: getPerms(['Inventory.View', 'Inventory.Transfer', 'Inventory.Receive'])
    },
    {
        name: 'Store Supervisor',
        description: 'Receive inventory, approve receiving, branch inventory',
        isSystem: true,
        permissions: getPerms(['Dashboard.View', 'Inventory.View', 'Inventory.Receive', 'Inventory.Return', 'POS.View', 'Reports.View'])
    },
    {
        name: 'Store Staff', // Or just 'User' in legacy
        description: 'Receive shipments',
        isSystem: true,
        permissions: getPerms(['Inventory.View', 'Inventory.Receive'])
    },
    {
        name: 'Leader', // Legacy mapping
        description: 'Store Leader (Legacy)',
        isSystem: true,
        permissions: getPerms(['Dashboard.View', 'Inventory.View', 'Inventory.Receive', 'Inventory.Return', 'POS.', 'Reports.View', 'CRM.View'], ['POS.Delete'])
    },
    {
        name: 'Cashier',
        description: 'POS Transactions',
        isSystem: true,
        permissions: getPerms(['POS.View', 'POS.Create', 'POS.PrintReceipt', 'Inventory.View', 'CRM.View', 'Inventory.Receive'])
    },
    {
        name: 'Technician',
        description: 'Service Module',
        isSystem: true,
        permissions: getPerms(['Service.View', 'Service.Manage'])
    },
    {
        name: 'Finance',
        description: 'View Sales, Payments, Financial Reports',
        isSystem: true,
        permissions: getPerms(['Dashboard.View', 'Finance.', 'Reports.', 'POS.View'])
    },
    {
        name: 'Admin',
        description: 'Admin (Legacy)',
        isSystem: true,
        permissions: getPerms(['Dashboard.View', 'Reports.', 'Inventory.', 'POS.View', 'CRM.View'])
    }
];
async function main() {
    console.log('🌱 Seeding Permissions & Roles...');
    // 1. Seed Permissions
    for (const perm of permissionsData) {
        await prisma.permission.upsert({
            where: { action: perm.action },
            update: { description: perm.description, module: perm.module },
            create: perm
        });
    }
    console.log('✅ Permissions seeded.');
    // 2. Seed Roles and RolePermissions
    const allDbPerms = await prisma.permission.findMany();
    const permMap = new Map(allDbPerms.map(p => [p.action, p.id]));
    for (const r of rolesData) {
        const role = await prisma.role.upsert({
            where: { name: r.name },
            update: { description: r.description, isSystem: r.isSystem },
            create: { name: r.name, description: r.description, isSystem: r.isSystem }
        });
        // Clear old perms
        await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
        // Insert new perms
        const rolePerms = r.permissions.map(action => ({
            roleId: role.id,
            permissionId: permMap.get(action)
        }));
        if (rolePerms.length > 0) {
            await prisma.rolePermission.createMany({ data: rolePerms, skipDuplicates: true });
        }
    }
    console.log('✅ Roles & RolePermissions seeded.');
    // 3. Migrate Users (Assign roleId based on legacy role string)
    const users = await prisma.user.findMany({ where: { roleId: null } });
    let migrated = 0;
    for (const user of users) {
        let targetRole = user.role;
        // Map legacy 'User' string to 'Store Staff' or 'Cashier' if you want, but for now we keep 'User' if it exists or map to 'Store Staff'
        if (targetRole === 'User')
            targetRole = 'Store Staff';
        const roleRecord = await prisma.role.findUnique({ where: { name: targetRole } });
        if (roleRecord) {
            await prisma.user.update({
                where: { id: user.id },
                data: { roleId: roleRecord.id }
            });
            migrated++;
        }
    }
    console.log(`✅ Migrated ${migrated} users to new RBAC system.`);
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-rbac.js.map