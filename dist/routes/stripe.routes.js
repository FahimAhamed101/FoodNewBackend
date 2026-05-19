"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stripe_controller_1 = __importDefault(require("../controllers/stripe.controller"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const validate_1 = require("../middlewares/validate");
const stripe_validation_1 = require("../validations/stripe.validation");
const router = (0, express_1.Router)();
/**
 * Public endpoint - Get Stripe config (publishable key)
 */
router.get('/config', stripe_controller_1.default.getConfig);
/**
 * Webhook endpoint - NO authentication (Stripe signature verification instead)
 * IMPORTANT: This must be registered BEFORE express.json() middleware
 * See app.ts for raw body handling
 */
router.post('/webhook', stripe_controller_1.default.handleWebhook);
/**
 * Customer endpoints - Create payment intent
 */
router.post('/create-payment-intent', authenticate_1.authenticate, (0, requireRole_1.requireRole)(['CUSTOMER']), (0, validate_1.validate)(stripe_validation_1.createPaymentIntentSchema), stripe_controller_1.default.createPaymentIntent);
/**
 * Customer endpoints - Get payment status
 */
router.get('/payment-status/:paymentIntentId', authenticate_1.authenticate, (0, validate_1.validate)(stripe_validation_1.paymentStatusSchema), stripe_controller_1.default.getPaymentStatus);
/**
 * Admin/Provider endpoints - Create refund
 */
router.post('/refund', authenticate_1.authenticate, (0, requireRole_1.requireRole)(['ADMIN', 'PROVIDER']), (0, validate_1.validate)(stripe_validation_1.refundSchema), stripe_controller_1.default.createRefund);
exports.default = router;
