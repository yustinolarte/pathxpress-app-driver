import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createRoute() {
    console.log('🚚 Creating test route...');

    try {
        // Get the driver first
        const driver = await prisma.driver.findUnique({
            where: { username: 'driver' }
        });

        if (!driver) {
            throw new Error('Driver not found! Run seed first.');
        }

        // Create route
        const route = await prisma.route.create({
            data: {
                id: 'DXB-2025-001',
                driverId: driver.id,
                date: new Date(),
                zone: 'Dubai Marina',
                vehicleInfo: 'Van - DXB 4523',
                status: 'PENDING',
                deliveries: {
                    create: [
                        {
                            customerName: 'Carlos Mendoza',
                            customerPhone: '+971 50 123 4567',
                            address: 'Downtown Dubai, Blvd Plaza, Piso 15',
                            latitude: 25.1972,
                            longitude: 55.2744,
                            packageRef: 'PKG-001',
                            weight: '2.5kg',
                            dimensions: '30x20x15cm',
                            type: 'COD',
                            codAmount: 150.00,
                            status: 'PENDING'
                        },
                        {
                            customerName: 'Sarah Johnson',
                            customerPhone: '+971 55 987 6543',
                            address: 'Dubai Marina, Marina Gate 2',
                            latitude: 25.0854,
                            longitude: 55.1435,
                            packageRef: 'PKG-002',
                            weight: '1.2kg',
                            dimensions: '25x15x10cm',
                            type: 'PREPAID',
                            codAmount: 0,
                            status: 'PENDING'
                        }
                    ]
                }
            },
            include: { deliveries: true }
        });

        console.log('✅ Route created successfully!');
        console.log('   ID:', route.id);
        console.log('   Deliveries:', route.deliveries.length);

    } catch (error) {
        console.error('❌ Error creating route:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createRoute();
