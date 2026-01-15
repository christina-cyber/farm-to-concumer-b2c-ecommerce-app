import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('password123', 10);

    // Create Admin
    await prisma.user.upsert({
        where: { email: 'admin@farm2home.com' },
        update: {},
        create: {
            email: 'admin@farm2home.com',
            passwordHash,
            role: Role.ADMIN,
            isVerified: true,
        },
    });

    // Create Farmer
    const farmerUser = await prisma.user.upsert({
        where: { email: 'farmer@local.com' },
        update: {},
        create: {
            email: 'farmer@local.com',
            passwordHash,
            role: Role.FARMER,
            isVerified: true,
        },
    });

    const farmerProfile = await prisma.farmerProfile.upsert({
        where: { userId: farmerUser.id },
        update: {},
        create: {
            userId: farmerUser.id,
            farmName: 'Green Valley Farms',
            latitude: 27.7172, // Kathmandu
            longitude: 85.3240,
            address: 'Kathmandu, Nepal',
        },
    });

    // Create Products
    await prisma.product.create({
        data: {
            farmerId: farmerProfile.id,
            name: 'Organic Tomatoes',
            category: 'Vegetables',
            pricePerKg: 120,
            stockKg: 50,
            harvestDate: new Date(),
        },
    });

    // Create Delivery Partner
    const deliveryUser = await prisma.user.upsert({
        where: { email: 'partner@local.com' },
        update: {},
        create: {
            email: 'partner@local.com',
            passwordHash,
            role: Role.DELIVERY_PARTNER,
            isVerified: true,
        },
    });

    await prisma.deliveryPartner.upsert({
        where: { userId: deliveryUser.id },
        update: {},
        create: {
            userId: deliveryUser.id,
            vehicleType: 'Bike',
            currentLat: 27.7172, // Same as farmer for instant match
            currentLong: 85.3240,
            isAvailable: true
        }
    });

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
