import express from 'express';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddleware';
import { getTrackingInfo } from '../controllers/trackingController';

const router = express.Router();

// Customer tracking endpoint
router.get('/:orderId', authenticateToken, authorizeRole(['CUSTOMER']), getTrackingInfo);

export default router;
