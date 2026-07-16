"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting Company Seeding...');
    // 1. Branches
    const branches = [
        { id: 'B-HQ-MGT', name: 'HQ - Management', brand: 'Holding', isWarehouse: false },
        { id: 'B-HQ-MKT', name: 'Marketing Pusat', brand: 'Holding', isWarehouse: false },
        { id: 'B-HQ-FIN', name: 'Finance', brand: 'Holding', isWarehouse: false },
        { id: 'B-HQ-HC', name: 'HC/GA', brand: 'Holding', isWarehouse: false },
        { id: 'B-DIV-BSB', name: 'Divisi BSB', brand: 'BSB', isWarehouse: false },
        { id: 'B-DIV-B2B', name: 'Divisi B2B', brand: 'B2B', isWarehouse: false },
        { id: 'B-DIV-CRM', name: 'Divisi CRM', brand: 'CRM', isWarehouse: false },
        { id: 'B-DIV-MARCOM', name: 'Marketing Communication', brand: 'Holding', isWarehouse: false },
        { id: 'B-STORE-RLBDG', name: 'Republic Laptop Bandung', brand: 'Republic Laptop', isWarehouse: false },
        { id: 'B-STORE-ILBDG', name: 'Importir Laptop Bandung', brand: 'Importir Laptop', isWarehouse: false },
        { id: 'B-STORE-RLSLO', name: 'Republic Laptop Solo', brand: 'Republic Laptop', isWarehouse: false },
        { id: 'B-STORE-ILJOG', name: 'Importir Laptop Jogja', brand: 'Importir Laptop', isWarehouse: false },
        { id: 'B-WH-PUSAT', name: 'Warehouse Pusat', brand: 'Holding', isWarehouse: true }
    ];
    for (const b of branches) {
        await prisma.branch.upsert({
            where: { id: b.id },
            update: { name: b.name, brand: b.brand, isWarehouse: b.isWarehouse },
            create: b
        });
    }
    console.log(`✅ Seeded ${branches.length} Branches / Divisons`);
    // 2. Users
    const defaultPassword = await bcryptjs_1.default.hash('Zabran2026!', 10);
    let userIdCounter = 200000;
    const usersToSeed = [
        { name: 'Bayu Aji', role: 'Management', branchId: 'B-HQ-MGT', title: 'CEO' },
        { name: 'Rosaliana Lira Devianti', role: 'Management', branchId: 'B-HQ-MGT', title: 'ISTRI CEO' },
        { name: 'Delly Fathurachman', role: 'Management', branchId: 'B-HQ-MGT', title: 'COO' },
        { name: 'Muhamad Rasyid Nur', role: 'Management', branchId: 'B-HQ-MGT', title: 'ASISTEN PRIBADI CEO' },
        { name: 'Nurafiffah Arrosyadah', role: 'Admin', branchId: 'B-HQ-MKT', title: 'KONTEN KREATOR PUSAT' },
        { name: 'Dilla Anggraini', role: 'Manager', branchId: 'B-HQ-HC', title: 'MANAGER HC/GA' },
        { name: 'Salwa Tazkiatun Nupus', role: 'Admin', branchId: 'B-DIV-BSB', title: 'TEAM BSB/KONTEN BSB' },
        { name: 'Muhammad Hashemi Elshabaz', role: 'Manager', branchId: 'B-DIV-B2B', title: 'MANAGER B2B' },
        { name: 'Dewi Puspita Sari', role: 'Manager', branchId: 'B-HQ-FIN', title: 'MANAGER FINANCE' },
        { name: 'Elsa Fitriani', role: 'Finance', branchId: 'B-HQ-FIN', title: 'STAFF ACCOUNTING - PAYABLE' },
        { name: 'Nur Cipta Mustikasari', role: 'Admin', branchId: 'B-DIV-CRM', title: 'STAFF CRM' },
        { name: 'Tengku Reza Faisal', role: 'Manager', branchId: 'B-HQ-MKT', title: 'MANAGER MARKETING' },
        { name: 'Firman Permana Putra', role: 'Leader', branchId: 'B-HQ-MKT', title: 'LEADER KONTEN REPUBLIC LAPTOP' },
        { name: 'Tiane Aulia Rahmah', role: 'Leader', branchId: 'B-HQ-MKT', title: 'ASISTEN MANAGER MARKETING & B2B' },
        { name: 'Arya Tri Setiawan', role: 'Admin', branchId: 'B-HQ-MKT', title: 'KONTEN KREATOR PUSAT IL' },
        { name: 'Agus Sudaryat', role: 'Leader', branchId: 'B-HQ-HC', title: 'LEADER HC/GA' },
        { name: 'Muhammad Iman Ismail', role: 'Admin', branchId: 'B-HQ-HC', title: 'STAFF HC GA' },
        { name: 'Alvin Maulana Akbar', role: 'Admin', branchId: 'B-HQ-MKT', title: 'KONTEN & VIDEGRAPHER PUSAT RL' },
        { name: 'Dedi Trisniadi', role: 'Management', branchId: 'B-DIV-MARCOM', title: 'MARKETING COMMUNICATION' }, // Giving Management to Dedi for sysadmin purposes
        { name: 'Laela Taslya', role: 'Manager', branchId: 'B-HQ-MKT', title: 'MANAGER BRAND REPUBLIC LAPTOP' },
        { name: 'Mutia Kenia Prastika', role: 'Manager', branchId: 'B-HQ-MKT', title: 'MANAGER BRAND IMPORTIR LAPTOP' },
        { name: 'Annisa Fauziah', role: 'Admin', branchId: 'B-HQ-MKT', title: 'KONTEN PUSAT IL' },
        { name: 'Pupu Purnama', role: 'Manager', branchId: 'B-WH-PUSAT', title: 'Manager Purchasing & Warehouse' },
        { name: 'Rahcman Arum Saputra', role: 'Leader', branchId: 'B-WH-PUSAT', title: 'Asisten Manager Purchasing' },
        { name: 'Ramlan Sudian', role: 'Leader', branchId: 'B-WH-PUSAT', title: 'Leader Warehouse' },
        { name: 'Surya Barhkan', role: 'Warehouse', branchId: 'B-WH-PUSAT', title: 'Staff Warehouse' },
        { name: 'Lastri', role: 'Warehouse', branchId: 'B-WH-PUSAT', title: 'Staff Warehouse' },
        { name: 'Aldy Sapta', role: 'Warehouse', branchId: 'B-WH-PUSAT', title: 'Staff Warehouse' },
        { name: 'Sona Septian', role: 'Leader', branchId: 'B-HQ-MGT', title: 'Leader Teknisi All' },
        { name: 'Naufal Aziz', role: 'Leader', branchId: 'B-STORE-RLBDG', title: 'Leader Outlet RL Bandung' },
        { name: 'Dea Riskika', role: 'Leader', branchId: 'B-STORE-ILBDG', title: 'Leader Outlet IL Bandung' },
        { name: 'Dilla Syafaatun Azzahra', role: 'Leader', branchId: 'B-STORE-RLSLO', title: 'Leader Outlet RL Solo' },
        { name: 'Qotrun Nada', role: 'Leader', branchId: 'B-STORE-ILJOG', title: 'Leader Outlet IL Jogja' }
    ];
    let index = 0;
    for (const u of usersToSeed) {
        const email = u.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '@zabran.com';
        userIdCounter++;
        const id = (Date.now() + index).toString().slice(-6); // unique 6-digit-ish
        index++;
        // Check if user exists by email
        const existing = await prisma.user.findUnique({ where: { email } });
        if (!existing) {
            await prisma.user.create({
                data: {
                    id,
                    name: u.name,
                    email,
                    password: defaultPassword,
                    role: u.role,
                    branchId: u.branchId,
                    preferences: JSON.stringify({ title: u.title })
                }
            });
            console.log(`Created: ${u.name} (${email})`);
        }
        else {
            await prisma.user.update({
                where: { email },
                data: {
                    name: u.name,
                    role: u.role,
                    branchId: u.branchId,
                    preferences: JSON.stringify({ title: u.title })
                }
            });
            console.log(`Updated: ${u.name} (${email})`);
        }
    }
    console.log('✅ Seeded 33 Users');
    console.log('🎉 Seeding Complete!');
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed_company.js.map