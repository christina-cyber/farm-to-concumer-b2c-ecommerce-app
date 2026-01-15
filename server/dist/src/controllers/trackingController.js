"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrackingInfo = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getTrackingInfo = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user?.id;
        if (!userId)
            return res.sendStatus(401);
        const order = await prisma.order.findUnique({
            where: { id: Number(orderId) },
            include: { deliveryPartner: { include: { user: true } } }
        });
        if (!order)
            return res.status(404).json({ error: 'Order not found' });
        // Security: Only allow customer or intended recipient to track
        if (order.customerId !== userId) {
            // Ideally also allow Admin or Farmer, but req says "Only order owner"
            return res.status(403).json({ error: 'Unauthorized to track this order' });
        }
        if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
            return res.json({
                orderId: order.id,
                status: order.status,
                message: 'Order execution completed'
            });
        }
        res.json({
            orderId: order.id,
            status: order.status,
            currentLocation: {
                lat: order.currentLat,
                lng: order.currentLong,
                updatedAt: order.lastLocationUpdate
            },
            partner: order.deliveryPartner ? {
                name: order.deliveryPartner.user.email, // Or name if we had it
                vehicle: order.deliveryPartner.vehicleType
            } : null
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Tracking failed' });
    }
};
exports.getTrackingInfo = getTrackingInfo;
