import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['error', 'warn'],
});

// Test connection on startup
prisma.$connect()
    .then(() => console.log('✅ Database connected successfully'))
    .catch((err) => console.error('❌ Database connection failed:', err));

export default prisma;
