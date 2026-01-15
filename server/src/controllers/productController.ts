import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Add Request type that includes user
interface AuthRequest extends Request {
    user?: {
        id: number;
        role: string;
    };
}

export const createProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { name, category, pricePerKg, stockKg, harvestDate } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.sendStatus(401);

        const farmerProfile = await prisma.farmerProfile.findUnique({
            where: { userId },
        });

        if (!farmerProfile) {
            return res.status(403).json({ error: 'Farmer profile not found' });
        }

        const product = await prisma.product.create({
            data: {
                farmerId: farmerProfile.id,
                name,
                category,
                pricePerKg: parseFloat(pricePerKg),
                stockKg: parseFloat(stockKg),
                harvestDate: new Date(harvestDate),
            },
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create product' });
    }
};

export const getMyProducts = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.sendStatus(401);

        const farmerProfile = await prisma.farmerProfile.findUnique({
            where: { userId },
        });

        if (!farmerProfile) return res.status(403).json({ error: 'Not a farmer' });

        const products = await prisma.product.findMany({
            where: { farmerId: farmerProfile.id, isDeleted: false },
        });

        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { pricePerKg, stockKg } = req.body;
        const userId = req.user?.id;

        // Verify ownership
        const product = await prisma.product.findUnique({ where: { id: Number(id) }, include: { farmer: true } });

        if (!product || product.farmer.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updated = await prisma.product.update({
            where: { id: Number(id) },
            data: {
                pricePerKg: pricePerKg ? parseFloat(pricePerKg) : undefined,
                stockKg: stockKg ? parseFloat(stockKg) : undefined,
            },
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const product = await prisma.product.findUnique({ where: { id: Number(id) }, include: { farmer: true } });

        if (!product || product.farmer.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await prisma.product.update({
            where: { id: Number(id) },
            data: { isDeleted: true },
        });

        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
};
