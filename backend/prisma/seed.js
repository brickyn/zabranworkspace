"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting seed...');
    // 1. Create Branches
    const branch1 = await prisma.branch.upsert({
        where: { id: 'branch-001' },
        update: {},
        create: {
            id: 'branch-001',
            name: 'Cabang Utama Jakarta',
            address: 'Jl. Sudirman No. 1, Jakarta',
        },
    });
    const branch2 = await prisma.branch.upsert({
        where: { id: 'branch-002' },
        update: {},
        create: {
            id: 'branch-002',
            name: 'Cabang Bandung',
            address: 'Jl. Dago No. 10, Bandung',
        },
    });
    console.log('Branches created');
    // 2. Create Users
    const passwordHash = await bcryptjs_1.default.hash('password123', 10);
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@zabran.com' },
        update: {},
        create: {
            id: '900001',
            email: 'admin@zabran.com',
            password: passwordHash,
            name: 'Dedi Trisniadi',
            role: 'Super Admin',
        },
    });
    const cashier = await prisma.user.upsert({
        where: { email: 'kasir1@zabran.com' },
        update: {},
        create: {
            id: '100001',
            email: 'kasir1@zabran.com',
            password: passwordHash,
            name: 'Budi Kasir',
            role: 'Cashier',
            branchId: branch1.id,
        },
    });
    console.log('Users created');
    // 3. Create Products (Serial Numbers)
    const products = [
        {
            id: 'ASUS-240705-001',
            name: 'ASUS ROG Zephyrus G14',
            brand: 'ASUS',
            model: 'Zephyrus G14',
            processor: 'Ryzen 9 7940HS',
            ram: '16GB',
            storage: '1TB NVMe',
            buyPrice: 20000000,
            sellPrice: 25000000,
            branchId: branch1.id,
            status: 'Available',
            category: 'Laptop'
        },
        {
            id: 'ASUS-240705-002',
            name: 'ASUS ROG Zephyrus G14',
            brand: 'ASUS',
            model: 'Zephyrus G14',
            processor: 'Ryzen 9 7940HS',
            ram: '16GB',
            storage: '1TB NVMe',
            buyPrice: 20000000,
            sellPrice: 25000000,
            branchId: branch1.id,
            status: 'Available',
            category: 'Laptop'
        },
        {
            id: 'APP-240705-001',
            name: 'MacBook Pro M2 14-inch',
            brand: 'Apple',
            model: 'MacBook Pro',
            processor: 'M2 Pro',
            ram: '16GB',
            storage: '512GB',
            buyPrice: 28000000,
            sellPrice: 32000000,
            branchId: branch1.id,
            status: 'Available',
            category: 'Laptop'
        },
        {
            id: 'LEN-240705-001',
            name: 'Lenovo Legion 5 Pro',
            brand: 'Lenovo',
            model: 'Legion 5 Pro',
            processor: 'Core i7-13700HX',
            ram: '32GB',
            storage: '1TB NVMe',
            buyPrice: 24000000,
            sellPrice: 27500000,
            branchId: branch2.id,
            status: 'Available',
            category: 'Laptop'
        },
        {
            id: 'SRV-240705-001',
            name: 'Service Ganti Layar Macbook',
            brand: 'Service',
            buyPrice: 0,
            sellPrice: 3500000,
            branchId: branch1.id,
            status: 'Available',
            category: 'Service'
        },
        {
            id: 'ACC-240705-001',
            name: 'Logitech MX Master 3S',
            brand: 'Logitech',
            buyPrice: 1200000,
            sellPrice: 1600000,
            branchId: branch1.id,
            status: 'Available',
            category: 'Aksesoris'
        },
        {
            id: 'RENT-240705-001',
            name: 'Sewa Laptop Lenovo Thinkpad 1 Bulan',
            brand: 'Rental',
            buyPrice: 0,
            sellPrice: 850000,
            branchId: branch1.id,
            status: 'Available',
            category: 'Sewa'
        }
    ];
    for (const p of products) {
        await prisma.product.upsert({
            where: { id: p.id },
            update: {},
            create: p,
        });
    }
    console.log('Products created');
    // 4. Create Transactions (Dummy)
    const tx1 = await prisma.transaction.upsert({
        where: { id: 'TX-2026-07-001' },
        update: {},
        create: {
            id: 'TX-2026-07-001',
            branchId: branch1.id,
            cashierId: cashier.id,
            totalAmount: 32000000,
            paymentMethod: 'Transfer',
            status: 'completed',
            items: {
                create: [
                    { productId: 'APP-240705-001', sellingPrice: 32000000, subtotal: 32000000 }
                ]
            }
        }
    });
    const tx2 = await prisma.transaction.upsert({
        where: { id: 'TX-2026-07-002' },
        update: {},
        create: {
            id: 'TX-2026-07-002',
            branchId: branch1.id,
            cashierId: cashier.id,
            totalAmount: 5100000,
            paymentMethod: 'Cash',
            status: 'completed',
            items: {
                create: [
                    { productId: 'SRV-240705-001', sellingPrice: 3500000, subtotal: 3500000 },
                    { productId: 'ACC-240705-001', sellingPrice: 1600000, subtotal: 1600000 }
                ]
            }
        }
    });
    const tx3 = await prisma.transaction.upsert({
        where: { id: 'TX-2026-07-003' },
        update: {},
        create: {
            id: 'TX-2026-07-003',
            branchId: branch1.id,
            cashierId: cashier.id,
            totalAmount: 850000,
            paymentMethod: 'Cash',
            status: 'completed',
            items: {
                create: [
                    { productId: 'RENT-240705-001', sellingPrice: 850000, subtotal: 850000 }
                ]
            }
        }
    });
    console.log('Dummy transactions created');
    console.log('Seeding finished.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map