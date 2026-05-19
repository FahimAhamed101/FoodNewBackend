"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const notification_controller_1 = __importDefault(require("../controllers/notification.controller"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const router = express_1.default.Router();
const notificationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many notification requests, please try again later',
    },
});
router.use(authenticate_1.authenticate);
router.use(notificationLimiter);
router.get('/', (0, requireRole_1.requireRole)(['CUSTOMER', 'PROVIDER']), notification_controller_1.default.getNotifications);
router.patch('/:id/read', (0, requireRole_1.requireRole)(['CUSTOMER', 'PROVIDER']), notification_controller_1.default.markAsRead);
exports.default = router;
