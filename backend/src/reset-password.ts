import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPassword() {
    console.log('🔄 Resetting password for user "driver"...');

    try {
        const hashedPassword = await bcrypt.hash('12345', 10);

        const user = await prisma.driver.update({
            where: { username: 'driver' },
            data: { password: hashedPassword }
        });

        console.log('✅ Password updated successfully for:', user.username);

        // Verify immediately
        const isMatch = await bcrypt.compare('12345', user.password);
        console.log('🔐 Verification - Password "12345" match:', isMatch ? '✅ YES' : '❌ NO');

    } catch (error) {
        console.error('❌ Error updating password:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
