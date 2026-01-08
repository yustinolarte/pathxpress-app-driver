import { PrismaClient, DeliveryType, DeliveryStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 STARTING CLEANUP...');

    // 1. Clean up operational data (Order matters due to foreign keys)
    await prisma.report.deleteMany({});
    console.log('✅ Reports deleted.');

    await prisma.delivery.deleteMany({});
    console.log('✅ Deliveries deleted.');

    // Optional: Clear shifts if you want a fresh start for time tracking too
    // await prisma.shiftBreak.deleteMany({});
    // await prisma.shift.deleteMany({});

    await prisma.route.deleteMany({});
    console.log('✅ Routes deleted.');

    console.log('🌱 SEEDING FRESH DATA...');

    const routeId = 'DXB-2026-001';

    // 2. Create the Route
    await prisma.route.create({
        data: {
            id: routeId,
            date: new Date(),
            zone: 'Sharjah - Ajman',
            vehicleInfo: 'Van 305 (Sharjah Route)',
            status: 'PENDING',
        }
    });
    console.log(`✅ Route ${routeId} created.`);

    // 3. Add Packages with Optimized Addresses for Navigation

    // Package 1: Sharjah (Delhi Nihari / Rolla)
    // Coordinates for Delhi Nihari Rolla: 25.3585° N, 55.3923° E
    await prisma.delivery.create({
        data: {
            routeId: routeId,
            customerName: 'Somaya Alam',
            customerPhone: '+971 54 532 2613',
            // Cleaned address for better navigation + Details
            address: 'Delhi Nihari Restaurant, Al Rolla Area, near Abdul Aziz Building, Sharjah, UAE',
            packageRef: 'PX202600017',
            weight: '5.0 KG',
            type: DeliveryType.COD,
            codAmount: 120,
            status: DeliveryStatus.PENDING,
            notes: 'Building: Abdul Aziz Bldg. Service: DOM',
            // Accurate coordinates for Rolla Area
            latitude: 25.3585,
            longitude: 55.3923
        }
    });
    console.log('✅ Added Package 1: Somaya Alam (Sharjah)');

    // Package 2: Ajman (Gulfa Towers)
    // Coordinates for Gulfa Towers Ajman: 25.4024° N, 55.4402° E
    await prisma.delivery.create({
        data: {
            routeId: routeId,
            customerName: 'Rubina Ersari',
            customerPhone: '+90 501 144 17 13',
            // Cleaned address for better navigation
            address: 'Gulfa Towers, Block A, Sheikh Khalifa Bin Zayed St, Al Rashidiya 1, Ajman, UAE',
            packageRef: 'PX202600016',
            weight: '5.0 KG',
            type: DeliveryType.COD,
            codAmount: 20,
            status: DeliveryStatus.PENDING,
            notes: 'Apt 602, Floor 6. Service: DOM',
            // Accurate coordinates for Gulfa Towers
            latitude: 25.4024,
            longitude: 55.4402
        }
    });
    console.log('✅ Added Package 2: Rubina Ersari (Ajman)');

    console.log('🚀 DATABASE RESET & RELOAD COMPLETE!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
