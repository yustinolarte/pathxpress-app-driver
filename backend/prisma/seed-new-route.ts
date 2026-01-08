import { PrismaClient, DeliveryType, DeliveryStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding new route DXB-2026-001...');

    const routeId = 'DXB-2026-001';

    // 1. Create or Update Route
    const route = await prisma.route.upsert({
        where: { id: routeId },
        update: {
            date: new Date(),
            zone: 'Sharjah - Ajman',
            vehicleInfo: 'Van 305 (Sharjah Route)',
            status: 'PENDING',
            driverId: null, // Reset driver assignment if re-running
        },
        create: {
            id: routeId,
            date: new Date(),
            zone: 'Sharjah - Ajman',
            vehicleInfo: 'Van 305 (Sharjah Route)',
            status: 'PENDING',
        }
    });

    console.log(`Route ${route.id} created/updated.`);

    // 2. Add Package 1: PX202600017 (Somaya Alam)
    await prisma.delivery.create({
        data: {
            routeId: routeId,
            customerName: 'Somaya Alam',
            customerPhone: '+971 54 532 2613',
            address: 'Sharjah rolla delhi nihari shop near abdul aziz building Abdul aziz buildig Rolla SH United Arab Emirates, Sharjah, UAE',
            packageRef: 'PX202600017',
            weight: '5.0 KG',
            type: DeliveryType.COD,
            codAmount: 120,
            status: DeliveryStatus.PENDING,
            notes: 'Service: DOM',
            latitude: 25.357119, // Approx Rolla Sharjah
            longitude: 55.391068
        }
    });
    console.log('Added package PX202600017 (Somaya Alam)');

    // 3. Add Package 2: PX202600016 (Rubina Ersari)
    await prisma.delivery.create({
        data: {
            routeId: routeId,
            customerName: 'Rubina Ersari',
            customerPhone: '+90 501 144 17 13',
            address: 'Rubina Ersari Gulfa Towers Sheikh Khalifa Bin Zayed Street Apartment 602, Floor 6, Block A, Gulfa Towers, Al Rashidiya, Ajman, UAE',
            packageRef: 'PX202600016',
            weight: '5.0 KG',
            type: DeliveryType.COD,
            codAmount: 20,
            status: DeliveryStatus.PENDING,
            notes: 'Service: DOM',
            latitude: 25.405216, // Approx Gulfa Towers Ajman
            longitude: 55.442800
        }
    });
    console.log('Added package PX202600016 (Rubina Ersari)');

    console.log('Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
