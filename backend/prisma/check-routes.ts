import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking routes in database...\n');

    const routes = await prisma.route.findMany({
        include: { deliveries: true }
    });

    if (routes.length === 0) {
        console.log('❌ No routes found in database!');
        console.log('   Run: npx ts-node prisma/seed-test-route.ts');
    } else {
        console.log(`✅ Found ${routes.length} route(s):\n`);
        routes.forEach(route => {
            console.log(`   📦 ${route.id}`);
            console.log(`      Status: ${route.status}`);
            console.log(`      Zone: ${route.zone || 'N/A'}`);
            console.log(`      Driver ID: ${route.driverId || 'Unassigned'}`);
            console.log(`      Deliveries: ${route.deliveries.length}`);
            console.log('');
        });
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
