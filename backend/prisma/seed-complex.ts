import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedComplex() {
    try {
        console.log('🌱 Seeding complex route...');

        // Get the driver (assuming ID 1 exists from previous seed)
        const driver = await prisma.driver.findFirst({
            where: { username: 'driver' }
        });

        if (!driver) {
            console.error('❌ Driver not found! Run the basic seed first.');
            return;
        }

        // Create a complex route
        const route = await prisma.route.create({
            data: {
                id: 'DXB-2025-002',
                driverId: driver.id,
                date: new Date(),
                zone: 'Business Bay & Downtown',
                vehicleInfo: 'Van - DXB 4523',
                status: 'PENDING',
                deliveries: {
                    create: [
                        // 1. Standard COD Delivery
                        {
                            customerName: 'Mohammed Al-Qasimi',
                            customerPhone: '+971 50 111 2222',
                            address: 'Business Bay, Executive Towers, Tower B, Apt 1204',
                            latitude: 25.1856,
                            longitude: 55.2634,
                            packageRef: 'PKG-002-001',
                            weight: '1.5kg',
                            dimensions: '20x20x20cm',
                            type: 'COD',
                            codAmount: 250.00,
                            status: 'PENDING'
                        },
                        // 2. High Value COD
                        {
                            customerName: 'Elena Petrova',
                            customerPhone: '+971 55 333 4444',
                            address: 'Downtown Dubai, The Address Blvd, Room 505',
                            latitude: 25.1975,
                            longitude: 55.2748,
                            packageRef: 'PKG-002-002',
                            weight: '0.5kg',
                            dimensions: '10x10x5cm',
                            type: 'COD',
                            codAmount: 1250.50,
                            status: 'PENDING'
                        },
                        // 3. Prepaid Delivery (Easy)
                        {
                            customerName: 'John Smith',
                            customerPhone: '+971 52 555 6666',
                            address: 'DIFC, Gate Village 3, Office 202',
                            latitude: 25.2123,
                            longitude: 55.2831,
                            packageRef: 'PKG-002-003',
                            weight: '3.0kg',
                            dimensions: '40x30x20cm',
                            type: 'PREPAID',
                            codAmount: 0,
                            status: 'PENDING'
                        },
                        // 4. Return Pickup
                        {
                            customerName: 'Zara Fashion Store',
                            customerPhone: '+971 4 123 4567',
                            address: 'Dubai Mall, Ground Floor, Unit 123',
                            latitude: 25.1988,
                            longitude: 55.2796,
                            packageRef: 'RET-002-004',
                            weight: '5.0kg',
                            dimensions: '50x40x30cm',
                            type: 'RETURN',
                            codAmount: 0,
                            status: 'PENDING',
                            notes: 'Pickup 5 boxes of returned items'
                        },
                        // 5. Already Completed (to test progress bar)
                        {
                            customerName: 'Tech Solutions Ltd',
                            customerPhone: '+971 4 987 6543',
                            address: 'Business Bay, The Opus, Office 808',
                            latitude: 25.1889,
                            longitude: 55.2667,
                            packageRef: 'PKG-002-005',
                            weight: '10.0kg',
                            dimensions: '60x50x40cm',
                            type: 'PREPAID',
                            codAmount: 0,
                            status: 'DELIVERED',
                            deliveredAt: new Date(Date.now() - 3600000), // 1 hour ago
                            proofPhotoUrl: 'https://via.placeholder.com/300'
                        },
                        // 6. Failed Attempt (to test status updates)
                        {
                            customerName: 'Sarah Connor',
                            customerPhone: '+971 56 777 8888',
                            address: 'City Walk, Building 12, Apt 303',
                            latitude: 25.2081,
                            longitude: 55.2632,
                            packageRef: 'PKG-002-006',
                            weight: '1.0kg',
                            dimensions: '15x15x15cm',
                            type: 'COD',
                            codAmount: 75.00,
                            status: 'ATTEMPTED',
                            attemptedAt: new Date(Date.now() - 1800000), // 30 mins ago
                            notes: 'Customer not answering phone'
                        }
                    ]
                }
            },
            include: {
                deliveries: true
            }
        });

        console.log('✅ Complex Route created:', route.id);
        console.log('✅ Deliveries created:', route.deliveries.length);
        console.log('   - 2 Pending COD');
        console.log('   - 1 Pending Prepaid');
        console.log('   - 1 Pending Return');
        console.log('   - 1 Completed');
        console.log('   - 1 Attempted');

    } catch (error) {
        console.error('❌ Seed error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedComplex();
