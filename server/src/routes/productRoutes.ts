import { Router } from 'express';
import { createProduct, getMyProducts, updateProduct, deleteProduct } from '../controllers/productController';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authenticateToken, authorizeRole(['FARMER']), createProduct);
router.get('/my-products', authenticateToken, authorizeRole(['FARMER']), getMyProducts);
router.patch('/:id', authenticateToken, authorizeRole(['FARMER']), updateProduct);
router.delete('/:id', authenticateToken, authorizeRole(['FARMER']), deleteProduct);

export default router;
