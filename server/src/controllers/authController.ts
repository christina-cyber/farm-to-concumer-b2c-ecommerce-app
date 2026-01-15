import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateAccessToken, generateRefreshToken } from '../utils/jwtUtils';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, role, farmName, address, latitude, longitude, vehicleType } = req.body;

        // Validate role
        if (!['CUSTOMER', 'FARMER', 'DELIVERY_PARTNER'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

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
        } else if (role === 'DELIVERY_PARTNER') {
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

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'User registration failed' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) return res.status(400).json({ error: 'User not found' });

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
};
