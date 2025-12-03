import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRoute() {
    console.log('🔍 Checking database for route "DXB-2025-001"...');

    try {
        const route = await prisma.route.findUnique({
            where: { id: 'DXB-2025-001' },
            include: { deliveries: true }
        });

        if (!route) {
            console.log('❌ Route "DXB-2025-001" NOT FOUND.');
        } else {
            console.log('✅ Route FOUND!');
            console.log('   ID:', route.id);
            console.log('   Status:', route.status);
            console.log('   Deliveries:', route.deliveries.length);
            route.deliveries.forEach(d => {
                console.log(`     - ${d.packageRef} (${d.status})`);
            });
        }

    } catch (error) {
        console.error('❌ Database connection error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRoute();
