"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDeliveryStatus = exports.getMyDeliveries = exports.assignNearestPartner = exports.toggleAvailability = exports.updateLocation = void 0;
const client_1 = require("@prisma/client");
const mapService_1 = require("../services/mapService");
const prisma = new client_1.PrismaClient();
const updateLocation = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { lat, long } = req.body;
        if (!userId)
            return res.sendStatus(401);
        await prisma.deliveryPartner.update({
            where: { userId },
            data: {
                currentLat: parseFloat(lat),
                currentLong: parseFloat(long)
            }
        });
        res.json({ message: 'Location updated' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update location' });
    }
};
exports.updateLocation = updateLocation;
const toggleAvailability = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { isAvailable } = req.body;
        if (!userId)
            return res.sendStatus(401);
        await prisma.deliveryPartner.update({
            where: { userId },
            data: { isAvailable: Boolean(isAvailable) }
        });
        res.json({ message: `Availability set to ${isAvailable}` });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update availability' });
    }
};
exports.toggleAvailability = toggleAvailability;
// Helper: Find and Assign Nearest Partner
const assignNearestPartner = async (orderId, farmerLat, farmerLong) => {
    try {
        const availablePartners = await prisma.deliveryPartner.findMany({
            where: { isAvailable: true, currentLat: { not: null }, currentLong: { not: null } }
        });
        if (availablePartners.length === 0)
            return null;
        let nearestPartner = null;
        let minDistance = Infinity;
        for (const partner of availablePartners) {
            const dist = (0, mapService_1.calculateDistance)(farmerLat, farmerLong, partner.currentLat, partner.currentLong);
            if (dist < minDistance) {
                minDistance = dist;
                nearestPartner = partner;
            }
        }
        if (nearestPartner) {
            await prisma.order.update({
                where: { id: orderId },
                data: { deliveryPartnerId: nearestPartner.id, status: 'ACCEPTED' } // Auto-accept for MVP logic? Or wait for partner to accept? 
                // Req says: "Accept / reject delivery requests". 
                // So valid flow: Assign -> PENDING_ACCEPTANCE -> Partner Accepts.
                // For MVP simplicity + "Assign nearest": I will assign it, and let Partner see it. 
            });
            return nearestPartner;
        }
        return null;
    }
    catch (error) {
        console.error("Assignment failed", error);
        return null;
    }
};
exports.assignNearestPartner = assignNearestPartner;
const getMyDeliveries = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.sendStatus(401);
        const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });
        if (!partner)
            return res.status(403).json({ error: 'Not a delivery partner' });
        const orders = await prisma.order.findMany({
            where: { deliveryPartnerId: partner.id },
            include: { farmer: true, customer: true, items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch deliveries' });
    }
};
exports.getMyDeliveries = getMyDeliveries;
const updateDeliveryStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body; // PICKED, DELIVERED
        const userId = req.user?.id;
        if (!['PICKED', 'DELIVERED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });
        if (!partner)
            return res.status(403);
        const order = await prisma.order.findUnique({ where: { id: Number(orderId) } });
        if (!order || order.deliveryPartnerId !== partner.id) {
            return res.status(403).json({ error: 'Unauthorized to update this order' });
        }
        await prisma.order.update({
            where: { id: order.id },
            data: { status }
        });
        res.json({ message: `Order status updated to ${status}` });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
};
exports.updateDeliveryStatus = updateDeliveryStatus;
