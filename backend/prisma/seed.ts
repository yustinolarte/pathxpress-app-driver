import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
    try {
        console.log('🌱 Seeding database...');

        // Create driver
        const hashedPassword = await bcrypt.hash('12345', 10);

        const driver = await prisma.driver.create({
            data: {
                username: 'driver',
                password: hashedPassword,
                fullName: 'Conductor de Prueba',
                email: 'driver@pathxpress.com',
                phone: '+971501234567',
                vehicleNumber: 'DXB-4523',
                status: 'ACTIVE'
            }
        });

        console.log('✅ Driver created:', driver.username);

        // Create a test route
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
                            packageRef: 'PKG-DXB-2025-001-001',
                            weight: '2.5kg',
                            dimensions: '30x20x15cm',
                            type: 'COD',
                            codAmount: 150.00,
                            status: 'PENDING'
                        },
                        {
                            customerName: 'Sarah Johnson',
                            customerPhone: '+971 55 987 6543',
                            address: 'Dubai Marina, Marina Gate 2, Apt 404',
                            latitude: 25.0854,
                            longitude: 55.1435,
                            packageRef: 'PKG-DXB-2025-001-002',
                            weight: '1.2kg',
                            dimensions: '25x15x10cm',
                            type: 'PREPAID',
                            codAmount: 0,
                            status: 'PENDING'
                        },
                        {
                            customerName: 'Ahmed Al-Farsi',
                            customerPhone: '+971 52 333 4444',
                            address: 'Jumeirah 1, Villa 45, Calle 12B',
                            latitude: 25.2231,
                            longitude: 55.2567,
                            packageRef: 'PKG-DXB-2025-001-003',
                            weight: '0.8kg',
                            dimensions: '20x15x10cm',
                            type: 'COD',
                            codAmount: 45.50,
                            status: 'PENDING'
                        }
                    ]
                }
            },
            include: {
                deliveries: true
            }
        });

        console.log('✅ Route created:', route.id);
        console.log('✅ Deliveries created:', route.deliveries.length);

        console.log('\n🎉 Seeding completed!');
        console.log('\n📝 Test credentials:');
        console.log('   Username: driver');
        console.log('   Password: 12345');
        console.log(`   Route ID: ${route.id}`);

    } catch (error) {
        console.error('❌ Seed error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
