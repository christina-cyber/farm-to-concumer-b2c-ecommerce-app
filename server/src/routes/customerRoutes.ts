import { Router } from 'express';
import { getAvailableProducts, placeOrder, getMyOrders } from '../controllers/customerController';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddleware';

const router = Router();

router.get('/products', getAvailableProducts); // Publicly accessible but needs lat/long
router.post('/order', authenticateToken, authorizeRole(['CUSTOMER']), placeOrder);
router.get('/my-orders', authenticateToken, authorizeRole(['CUSTOMER']), getMyOrders);

export default router;
