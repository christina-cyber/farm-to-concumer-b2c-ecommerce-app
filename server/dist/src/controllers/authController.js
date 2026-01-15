"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const jwtUtils_1 = require("../utils/jwtUtils");
const prisma = new client_1.PrismaClient();
const register = async (req, res) => {
    try {
        const { email, password, role, farmName, address, latitude, longitude, vehicleType } = req.body;
        // Validate role
        if (!['CUSTOMER', 'FARMER', 'DELIVERY_PARTNER'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                role,
                isVerified: true // Auto-verify for MVP
            },
        });
        // Create Profile based on Role
        if (role === 'FARMER') {
            if (!farmName || !latitude || !longitude) {
                return res.status(400).json({ error: 'Farm details required for Farmer' });
            }
            await prisma.farmerProfile.create({
                data: {
                    userId: user.id,
                    farmName,
                    address: address || 'N/A',
                    latitude,
                    longitude
                }
            });
        }
        else if (role === 'DELIVERY_PARTNER') {
            if (!vehicleType) {
                return res.status(400).json({ error: 'Vehicle type required for Delivery Partner' });
            }
            await prisma.deliveryPartner.create({
                data: {
                    userId: user.id,
                    vehicleType
                }
            });
        }
        const accessToken = (0, jwtUtils_1.generateAccessToken)(user);
        const refreshToken = (0, jwtUtils_1.generateRefreshToken)(user);
        res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'User registration failed' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(400).json({ error: 'User not found' });
        const validPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!validPassword)
            return res.status(400).json({ error: 'Invalid password' });
        const accessToken = (0, jwtUtils_1.generateAccessToken)(user);
        const refreshToken = (0, jwtUtils_1.generateRefreshToken)(user);
        res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } });
    }
    catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
};
exports.login = login;
