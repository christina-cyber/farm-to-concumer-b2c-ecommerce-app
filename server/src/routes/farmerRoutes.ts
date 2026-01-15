import { Router } from 'express';
import { getDashboardStats } from '../controllers/farmerController';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddleware';

const router = Router();

router.get('/stats', authenticateToken, authorizeRole(['FARMER']), getDashboardStats);

export default router;
