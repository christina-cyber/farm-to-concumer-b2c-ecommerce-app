"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user?.id;
        const farmerProfile = await prisma.farmerProfile.findUnique({
            where: { userId },
            include: { orders: true, products: true }
        });
        if (!farmerProfile)
            return res.sendStatus(403);
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};
exports.getDashboardStats = getDashboardStats;
