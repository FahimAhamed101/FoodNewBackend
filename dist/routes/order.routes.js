"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const order_controller_1 = __importDefault(require("../controllers/order.controller"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const validate_1 = require("../middlewares/validate");
const order_validation_1 = require("../validations/order.validation");
const router = express_1.default.Router();
const orderLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many order requests, please try again later',
    },
});
router.use(authenticate_1.authenticate);
router.use(orderLimiter);
router.post('/', (0, requireRole_1.requireRole)(['CUSTOMER']), (0, validate_1.validate)(order_validation_1.createOrderSchema), order_controller_1.default.createOrder);
router.patch('/:orderId/cancel', (0, requireRole_1.requireRole)(['CUSTOMER', 'PROVIDER']), (0, validate_1.validate)(order_validation_1.cancelOrderSchema), order_controller_1.default.cancelOrder);
router.get('/all', (0, requireRole_1.requireRole)(['CUSTOMER', 'PROVIDER']), (0, validate_1.validate)(order_validation_1.getOrdersQuerySchema), order_controller_1.default.getUserOrders);
router.get('/:orderId', (0, requireRole_1.requireRole)(['CUSTOMER', 'PROVIDER']), order_controller_1.default.getOrderDetails);
router.use((0, requireRole_1.requireRole)(['PROVIDER']));
router.get('/', (0, validate_1.validate)(order_validation_1.getOrdersQuerySchema), order_controller_1.default.getAllOrders);
router.get('/pending', order_controller_1.default.getPendingOrders);
router.get('/preparing', order_controller_1.default.getPreparingOrders);
router.get('/ready', order_controller_1.default.getReadyOrders);
router.get('/pickup', order_controller_1.default.getPickedUpOrders);
router.get('/completed', order_controller_1.default.getCompletedOrders);
router.get('/cancelled', order_controller_1.default.getCancelledOrders);
router.patch('/:orderId/accept', order_controller_1.default.acceptOrder);
router.patch('/:orderId/ready', order_controller_1.default.markReady);
router.patch('/:orderId/pickup', order_controller_1.default.markPickedUp);
router.patch('/:orderId/complete', order_controller_1.default.markCompleted);
router.patch('/:orderId/notify-pickup', order_controller_1.default.notifyReadyForPickup);
router.patch('/:orderId/notify-complete', order_controller_1.default.notifyCompleted);
exports.default = router;
