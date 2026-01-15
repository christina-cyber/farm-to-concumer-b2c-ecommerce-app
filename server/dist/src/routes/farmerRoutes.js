"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const farmerController_1 = require("../controllers/farmerController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.get('/stats', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorizeRole)(['FARMER']), farmerController_1.getDashboardStats);
exports.default = router;
