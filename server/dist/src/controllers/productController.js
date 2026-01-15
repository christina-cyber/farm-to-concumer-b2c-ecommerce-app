"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.getMyProducts = exports.createProduct = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createProduct = async (req, res) => {
    try {
        const { name, category, pricePerKg, stockKg, harvestDate } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.sendStatus(401);
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create product' });
    }
};
exports.createProduct = createProduct;
const getMyProducts = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.sendStatus(401);
        const farmerProfile = await prisma.farmerProfile.findUnique({
            where: { userId },
        });
        if (!farmerProfile)
            return res.status(403).json({ error: 'Not a farmer' });
        const products = await prisma.product.findMany({
            where: { farmerId: farmerProfile.id, isDeleted: false },
        });
        res.json(products);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};
exports.getMyProducts = getMyProducts;
const updateProduct = async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
};
exports.deleteProduct = deleteProduct;
