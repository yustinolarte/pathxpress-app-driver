import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createRoute2() {
    console.log('🚚 Creating Test Route 2 (DXB-2025-002)...');

    try {
        // Get the driver
        const driver = await prisma.driver.findUnique({
            where: { username: 'driver' }
        });

        if (!driver) {
            throw new Error('Driver not found!');
        }

        // Create route
        const route = await prisma.route.create({
            data: {
                id: 'DXB-2025-003',
                driverId: driver.id,
                date: new Date(),
                zone: 'Jumeirah Lakes Towers',
                vehicleInfo: 'Van - DXB 4523',
                status: 'PENDING',
                deliveries: {
                    create: [
                        {
                            customerName: 'Ahmed Al-Fayed',
                            customerPhone: '+971 52 999 8888',
                            address: 'JLT Cluster O, Reef Tower, Office 304',
                            latitude: 25.0735,
                            longitude: 55.1448,
                            packageRef: 'PKG-003',
                            weight: '5.0kg',
                            dimensions: '40x30x20cm',
                            type: 'PREPAID',
                            codAmount: 0,
                            status: 'PENDING'
                        },
                        {
                            customerName: 'Maria Gonzalez',
                            customerPhone: '+971 56 777 6666',
                            address: 'Dubai Marina Mall, Main Entrance',
                            latitude: 25.0763,
                            longitude: 55.1406,
                            packageRef: 'PKG-004',
                            weight: '1.0kg',
                            dimensions: '10x10x10cm',
                            type: 'COD',
                            codAmount: 450.50,
                            status: 'PENDING'
                        },
                        {
                            customerName: 'John Smith',
                            customerPhone: '+971 50 111 2222',
                            address: 'The Palm, Atlantis Hotel Lobby',
                            latitude: 25.1304,
                            longitude: 55.1171,
                            packageRef: 'PKG-005',
                            weight: '0.5kg',
                            dimensions: 'Envelope',
                            type: 'COD',
                            codAmount: 120.00,
                            status: 'PENDING'
                        }
                    ]
                }
            },
            include: { deliveries: true }
        });

        console.log('✅ Route 2 created successfully!');
        console.log('   ID:', route.id);
        console.log('   Deliveries:', route.deliveries.length);

    } catch (error) {
        console.error('❌ Error creating route:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createRoute2();
