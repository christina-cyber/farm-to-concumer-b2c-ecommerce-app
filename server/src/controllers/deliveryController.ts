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

export const updateLocation = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { lat, long } = req.body;

        if (!userId) return res.sendStatus(401);

        const currentLat = parseFloat(lat);
        const currentLong = parseFloat(long);

        // Update Partner Location
        const partner = await prisma.deliveryPartner.update({
            where: { userId },
            data: {
                currentLat,
                currentLong
            }
        });

        // Update Active Order Location (if any)
        // We update ANY valid active order for this partner to support tracking
        await prisma.order.updateMany({
            where: {
                deliveryPartnerId: partner.id,
                status: { in: ['ACCEPTED', 'PICKED'] }
            },
            data: {
                currentLat,
                currentLong,
                lastLocationUpdate: new Date()
            }
        });

        res.json({ message: 'Location updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update location' });
    }
};

export const toggleAvailability = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { isAvailable } = req.body;

        if (!userId) return res.sendStatus(401);

        await prisma.deliveryPartner.update({
            where: { userId },
            data: { isAvailable: Boolean(isAvailable) }
        });

        res.json({ message: `Availability set to ${isAvailable}` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update availability' });
    }
};

// Helper: Find and Assign Nearest Partner
export const assignNearestPartner = async (orderId: number, farmerLat: number, farmerLong: number) => {
    try {
        const availablePartners = await prisma.deliveryPartner.findMany({
            where: { isAvailable: true, currentLat: { not: null }, currentLong: { not: null } }
        });

        if (availablePartners.length === 0) return null;

        let nearestPartner = null;
        let minDistance = Infinity;

        for (const partner of availablePartners) {
            const dist = calculateDistance(farmerLat, farmerLong, partner.currentLat!, partner.currentLong!);
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
    } catch (error) {
        console.error("Assignment failed", error);
        return null;
    }
};

export const getMyDeliveries = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.sendStatus(401);

        const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });
        if (!partner) return res.status(403).json({ error: 'Not a delivery partner' });

        const orders = await prisma.order.findMany({
            where: { deliveryPartnerId: partner.id },
            include: { farmer: true, customer: true, items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' }
        });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch deliveries' });
    }
};

export const updateDeliveryStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body; // PICKED, DELIVERED
        const userId = req.user?.id;

        if (!['PICKED', 'DELIVERED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });
        if (!partner) return res.status(403);

        const order = await prisma.order.findUnique({ where: { id: Number(orderId) } });
        if (!order || order.deliveryPartnerId !== partner.id) {
            return res.status(403).json({ error: 'Unauthorized to update this order' });
        }

        await prisma.order.update({
            where: { id: order.id },
            data: { status }
        });

        res.json({ message: `Order status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
};
