"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customerController_1 = require("../controllers/customerController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.get('/products', customerController_1.getAvailableProducts); // Publicly accessible but needs lat/long
router.post('/order', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorizeRole)(['CUSTOMER']), customerController_1.placeOrder);
router.get('/my-orders', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorizeRole)(['CUSTOMER']), customerController_1.getMyOrders);
exports.default = router;
