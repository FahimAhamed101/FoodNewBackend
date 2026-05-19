"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cart_controller_1 = __importDefault(require("../controllers/cart.controller"));
const authenticate_1 = require("../middlewares/authenticate");
const validate_1 = require("../middlewares/validate");
const cart_validation_1 = require("../validations/cart.validation");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
const cartLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many cart requests, please try again later',
    },
});
router.use(authenticate_1.authenticate);
router.use(cartLimiter);
router.get('/', cart_controller_1.default.getCart);
router.get('/count', cart_controller_1.default.getCartCount);
router.post('/add', (0, validate_1.validate)(cart_validation_1.addToCartSchema), cart_controller_1.default.addToCart);
router.patch('/update', (0, validate_1.validate)(cart_validation_1.updateCartItemSchema), cart_controller_1.default.updateCartItem);
router.delete('/remove', (0, validate_1.validate)(cart_validation_1.removeFromCartSchema), cart_controller_1.default.removeFromCart);
router.delete('/clear', cart_controller_1.default.clearCart);
exports.default = router;
