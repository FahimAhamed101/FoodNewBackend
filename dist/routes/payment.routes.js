"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = __importDefault(require("../controllers/payment.controller"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
const paymentLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests to payment services. Please try again later.'
    }
});
router.use(authenticate_1.authenticate);
router.use((0, requireRole_1.requireRole)(['PROVIDER']));
router.use(paymentLimiter);
router.get('/overview', payment_controller_1.default.getOverview);
router.get('/history', payment_controller_1.default.getHistory);
router.get('/search', payment_controller_1.default.search);
exports.default = router;
