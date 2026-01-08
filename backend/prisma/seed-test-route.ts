import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding test route...');

    // Create a test route with deliveries
    const testRouteId = 'DXB-2024-001';

    // Check if route already exists
    const existingRoute = await prisma.route.findUnique({
        where: { id: testRouteId }
    });

    if (existingRoute) {
        console.log(`⚠️ Route ${testRouteId} already exists. Skipping...`);
        console.log('\n📱 QR Code Content (copy this to generate QR):');
        console.log(`   ${testRouteId}`);
        console.log('\n   Or as JSON: {"routeId": "' + testRouteId + '"}');
        return;
    }

    const route = await prisma.route.create({
        data: {
            id: testRouteId,
            date: new Date(),
            zone: 'Dubai Marina',
            vehicleInfo: 'Toyota Hiace - DXB 12345',
            status: 'PENDING',
            deliveries: {
                create: [
                    {
                        customerName: 'Ahmed Al Maktoum',
                        customerPhone: '+971501234567',
                        address: 'Marina Walk, Tower 3, Apt 1502, Dubai Marina',
                        latitude: 25.0805,
                        longitude: 55.1403,
                        packageRef: 'PKG-001',
                        weight: '2.5 kg',
                        dimensions: '30x20x15 cm',
                        type: 'COD',
                        codAmount: 150.00,
                        status: 'PENDING'
                    },
                    {
                        customerName: 'Sara Mohammed',
                        customerPhone: '+971502345678',
                        address: 'JBR Beach Residence, Building 5, Unit 2203',
                        latitude: 25.0778,
                        longitude: 55.1332,
                        packageRef: 'PKG-002',
                        weight: '1.2 kg',
                        dimensions: '25x15x10 cm',
                        type: 'PREPAID',
                        codAmount: 0,
                        status: 'PENDING'
                    },
                    {
                        customerName: 'Omar Hassan',
                        customerPhone: '+971503456789',
                        address: 'The Palm Jumeirah, Shoreline Apartments, Apt 301',
                        latitude: 25.1124,
                        longitude: 55.1390,
                        packageRef: 'PKG-003',
                        weight: '5.0 kg',
                        dimensions: '50x40x30 cm',
                        type: 'COD',
                        codAmount: 350.00,
                        status: 'PENDING'
                    },
                    {
                        customerName: 'Fatima Abdullah',
                        customerPhone: '+971504567890',
                        address: 'Dubai Media City, Building 6, Office 405',
                        latitude: 25.0928,
                        longitude: 55.1556,
                        packageRef: 'PKG-004',
                        weight: '0.8 kg',
                        dimensions: '20x15x8 cm',
                        type: 'PREPAID',
                        codAmount: 0,
                        status: 'PENDING'
                    },
                    {
                        customerName: 'Khalid Al Rashid',
                        customerPhone: '+971505678901',
                        address: 'Emirates Hills, Villa 23, Street 5',
                        latitude: 25.0595,
                        longitude: 55.1719,
                        packageRef: 'PKG-005',
                        weight: '3.3 kg',
                        dimensions: '35x25x20 cm',
                        type: 'COD',
                        codAmount: 225.50,
                        status: 'PENDING'
                    }
                ]
            }
        },
        include: {
            deliveries: true
        }
    });

    console.log('✅ Test route created successfully!');
    console.log(`   Route ID: ${route.id}`);
    console.log(`   Zone: ${route.zone}`);
    console.log(`   Deliveries: ${route.deliveries.length}`);
    console.log(`   Total COD: AED ${route.deliveries.reduce((sum, d) => sum + d.codAmount, 0).toFixed(2)}`);

    console.log('\n📱 QR Code Content (copy this to generate QR):');
    console.log('════════════════════════════════════════════════');
    console.log(`   ${testRouteId}`);
    console.log('════════════════════════════════════════════════');
    console.log('\n   Or as JSON: {"routeId": "' + testRouteId + '"}');
    console.log('\n💡 Use any QR code generator to create a QR with this text.');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
