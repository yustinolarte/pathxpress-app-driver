import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkUser() {
    console.log('🔍 Checking database for user "driver"...');

    try {
        const user = await prisma.driver.findUnique({
            where: { username: 'driver' }
        });

        if (!user) {
            console.log('❌ User "driver" NOT FOUND in database.');
        } else {
            console.log('✅ User "driver" FOUND!');
            console.log('   ID:', user.id);
            console.log('   Email:', user.email);
            console.log('   Password Hash:', user.password);

            // Verify password
            const isMatch = await bcrypt.compare('12345', user.password);
            console.log('🔐 Password "12345" match:', isMatch ? '✅ YES' : '❌ NO');
        }

    } catch (error) {
        console.error('❌ Database connection error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
