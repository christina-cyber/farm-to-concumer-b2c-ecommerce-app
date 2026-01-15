import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { calculateDistance } from '../services/mapService';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: {
        id: number;
        role: string;
    };
}

// Haversine formula usage to filter farmers within 25km
export const getAvailableProducts = async (req: Request, res: Response) => {
    try {
        const { lat, long, category } = req.query;

        if (!lat || !long) {
            return res.status(400).json({ error: 'User location (lat, long) required' });
        }

        const userLat = parseFloat(lat as string);
        const userLong = parseFloat(long as string);

        const products = await prisma.product.findMany({
            where: {
                isDeleted: false,
                stockKg: { gt: 0 },
                category: category ? String(category) : undefined
            },
            include: { farmer: true }
        });

        // Client-side filtering for MVP (better to use PostGIS in production)
        const nearbyProducts = products.filter(product => {
            const dist = calculateDistance(userLat, userLong, product.farmer.latitude, product.farmer.longitude);
            return dist <= 25;
        });

        res.json(nearbyProducts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

export const placeOrder = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { farmerId, items } = req.body; // items: [{ productId, quantity }]

        if (!userId) return res.sendStatus(401);

        // Calculate totals
        let totalAmount = 0;
        const orderItemsData = [];

        for (const item of items) {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            if (!product) return res.status(400).json({ error: `Product ${item.productId} not found` });
            if (product.stockKg < item.quantity) return res.status(400).json({ error: `Insufficient stock for ${product.name}` });

            totalAmount += product.pricePerKg * item.quantity;
            orderItemsData.push({
                productId: product.id,
                quantity: item.quantity,
                priceAtTime: product.pricePerKg
            });

            // Decrease stock
            await prisma.product.update({
                where: { id: product.id },
                data: { stockKg: product.stockKg - item.quantity }
            });
        }

        const deliveryFee = 50; // Fixed for now, or calc based on distance
        const platformFee = totalAmount * 0.05; // 5%

        const order = await prisma.order.create({
            data: {
                customerId: userId,
                farmerId,
                totalAmount: totalAmount + deliveryFee,
                deliveryFee,
                platformFee,
                status: 'PENDING',
                items: {
                    create: orderItemsData
                }
            },
            include: { items: true }
        });

        // Trigger auto-assignment
        // We need farmer location
        const farmer = await prisma.farmerProfile.findUnique({ where: { id: farmerId } });
        if (farmer) {
            import('../controllers/deliveryController').then(async (mod) => {
                await mod.assignNearestPartner(order.id, farmer.latitude, farmer.longitude);
            });
        }

        res.status(201).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Order placement failed' });
    }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.sendStatus(401);

        const orders = await prisma.order.findMany({
            where: { customerId: userId },
            include: { items: { include: { product: true } }, farmer: true },
            orderBy: { createdAt: 'desc' }
        });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};
