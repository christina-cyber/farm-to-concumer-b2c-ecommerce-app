import { Router } from 'express';
import { updateLocation, toggleAvailability, getMyDeliveries, updateDeliveryStatus } from '../controllers/deliveryController';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddleware';

const router = Router();

router.patch('/location', authenticateToken, authorizeRole(['DELIVERY_PARTNER']), updateLocation);
router.patch('/availability', authenticateToken, authorizeRole(['DELIVERY_PARTNER']), toggleAvailability);
router.get('/my-deliveries', authenticateToken, authorizeRole(['DELIVERY_PARTNER']), getMyDeliveries);
router.patch('/order/:orderId', authenticateToken, authorizeRole(['DELIVERY_PARTNER']), updateDeliveryStatus);

export default router;
