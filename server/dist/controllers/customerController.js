"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyOrders = exports.placeOrder = exports.getAvailableProducts = void 0;
const client_1 = require("@prisma/client");
const mapService_1 = require("../services/mapService");
const prisma = new client_1.PrismaClient();
// Haversine formula usage to filter farmers within 25km
const getAvailableProducts = async (req, res) => {
    try {
        const { lat, long, category } = req.query;
        if (!lat || !long) {
            return res.status(400).json({ error: 'User location (lat, long) required' });
        }
        const userLat = parseFloat(lat);
        const userLong = parseFloat(long);
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
            const dist = (0, mapService_1.calculateDistance)(userLat, userLong, product.farmer.latitude, product.farmer.longitude);
            return dist <= 25;
        });
        res.json(nearbyProducts);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};
exports.getAvailableProducts = getAvailableProducts;
const placeOrder = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { farmerId, items } = req.body; // items: [{ productId, quantity }]
        if (!userId)
            return res.sendStatus(401);
        // Calculate totals
        let totalAmount = 0;
        const orderItemsData = [];
        for (const item of items) {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            if (!product)
                return res.status(400).json({ error: `Product ${item.productId} not found` });
            if (product.stockKg < item.quantity)
                return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
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
            Promise.resolve().then(() => __importStar(require('../controllers/deliveryController'))).then(async (mod) => {
                await mod.assignNearestPartner(order.id, farmer.latitude, farmer.longitude);
            });
        }
        res.status(201).json(order);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Order placement failed' });
    }
};
exports.placeOrder = placeOrder;
const getMyOrders = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.sendStatus(401);
        const orders = await prisma.order.findMany({
            where: { customerId: userId },
            include: { items: { include: { product: true } }, farmer: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};
exports.getMyOrders = getMyOrders;
