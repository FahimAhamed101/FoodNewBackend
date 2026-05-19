"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const customerOrder_controller_1 = __importDefault(require("../controllers/customerOrder.controller"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const router = express_1.default.Router();
const orderListLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many requests, please try again later'
    }
});
router.use(authenticate_1.authenticate);
router.use((0, requireRole_1.requireRole)(['CUSTOMER']));
router.use(orderListLimiter);
router.get('/current', customerOrder_controller_1.default.getCurrentOrders);
router.get('/previous', customerOrder_controller_1.default.getPreviousOrders);
exports.default = router;
