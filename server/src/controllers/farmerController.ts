import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: {
        id: number;
        role: string;
    };
}

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const farmerProfile = await prisma.farmerProfile.findUnique({
            where: { userId },
            include: { orders: true, products: true }
        });

        if (!farmerProfile) return res.sendStatus(403);

        const totalOrders = farmerProfile.orders.length;
        const totalEarnings = farmerProfile.orders
            .filter(o => o.status === 'DELIVERED')
            .reduce((sum, o) => sum + (o.totalAmount - o.platformFee - o.deliveryFee), 0);

        const activeProducts = farmerProfile.products.filter(p => !p.isDeleted && p.stockKg > 0).length;

        res.json({
            totalOrders,
            totalEarnings,
            activeProducts
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};
