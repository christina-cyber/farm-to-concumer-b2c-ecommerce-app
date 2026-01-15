"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const trackingController_1 = require("../controllers/trackingController");
const router = express_1.default.Router();
// Customer tracking endpoint
router.get('/:orderId', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorizeRole)(['CUSTOMER']), trackingController_1.getTrackingInfo);
exports.default = router;
