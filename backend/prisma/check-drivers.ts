import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking drivers in database...\n');

    const drivers = await prisma.driver.findMany();

    if (drivers.length === 0) {
        console.log('❌ No drivers found in database!');
    } else {
        console.log(`✅ Found ${drivers.length} driver(s):\n`);
        drivers.forEach(driver => {
            console.log(`   👤 ID: ${driver.id}`);
            console.log(`      Username: ${driver.username}`);
            console.log(`      Full Name: ${driver.fullName}`);
            console.log(`      Status: ${driver.status}`);
            console.log('');
        });
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
