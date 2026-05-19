"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_service_1 = __importDefault(require("../services/stripe.service"));
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = __importDefault(require("../utils/AppError"));
const stripe_1 = __importDefault(require("../config/stripe"));
const config_1 = __importDefault(require("../config"));
class StripeController {
    constructor() {
        /**
         * POST /api/v1/stripe/create-payment-intent
         * Create a Stripe PaymentIntent and return client_secret
         */
        this.createPaymentIntent = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const customerId = req.user.userId;
            const { providerId, items, donationAmount, isDonation } = req.body;
            if (!providerId || !items || !Array.isArray(items) || items.length === 0) {
                throw new AppError_1.default('providerId and items are required', 400, 'INVALID_REQUEST');
            }
            // Validate items structure
            for (const item of items) {
                if (!item.foodId || !item.quantity || item.quantity < 1) {
                    throw new AppError_1.default('Each item must have foodId and quantity >= 1', 400, 'INVALID_ITEM');
                }
            }
            const result = yield stripe_service_1.default.createPaymentIntent({
                customerId,
                providerId,
                items,
                donationAmount,
                isDonation,
            });
            res.status(200).json({
                success: true,
                message: 'Payment intent created successfully',
                data: {
                    clientSecret: result.clientSecret,
                    paymentIntentId: result.paymentIntentId,
                    amount: result.amount,
                    breakdown: result.breakdown,
                },
            });
        }));
        /**
         * POST /api/v1/stripe/webhook
         * Handle Stripe webhook events
         * IMPORTANT: This endpoint must receive RAW body, not parsed JSON
         */
        this.handleWebhook = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            // Debug: Log all headers
            console.log('📋 [Stripe Webhook] Received headers:', JSON.stringify(req.headers, null, 2));
            const sig = req.headers['stripe-signature'];
            // Check for test webhook header (multiple variations)
            const testHeader = req.headers['x-test-webhook'] ||
                req.headers['X-Test-Webhook'] ||
                req.headers['X-TEST-WEBHOOK'];
            console.log('🔍 [Stripe Webhook] Test header value:', testHeader);
            // Also check if signature is a test signature
            const hasTestSignature = sig && (sig.includes('test_signature') || sig === 't=1234567890,v1=test_signature');
            const isTesting = testHeader === 'true' || testHeader === 'TRUE' || hasTestSignature;
            console.log('🎯 [Stripe Webhook] Is testing mode?', isTesting);
            let event;
            if (isTesting) {
                console.log('⚠️ [Stripe Webhook] Testing mode enabled. Bypassing signature verification...');
                // Handle raw Buffer or JSON body
                try {
                    event = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;
                    console.log('✅ [Stripe Webhook] Test event parsed successfully:', event.type);
                }
                catch (err) {
                    console.error('❌ [Stripe Webhook] Failed to parse test body:', err);
                    throw new AppError_1.default('Invalid JSON body for test webhook', 400, 'INVALID_TEST_BODY');
                }
            }
            else {
                console.log('🔒 [Stripe Webhook] Production mode. Verifying signature...');
                if (!sig) {
                    console.error('❌ [Stripe Webhook] Missing stripe-signature header');
                    throw new AppError_1.default('Missing stripe-signature header. For testing: add header "x-test-webhook: true" OR use stripe-signature: "t=1234567890,v1=test_signature"', 400, 'MISSING_SIGNATURE');
                }
                try {
                    event = stripe_1.default.webhooks.constructEvent(req.body, sig, config_1.default.stripe.webhookSecret);
                    console.log('✅ [Stripe Webhook] Signature verified successfully');
                }
                catch (err) {
                    console.error('❌ [Stripe Webhook] Signature verification failed:', err.message);
                    throw new AppError_1.default(`Webhook Error: ${err.message}. For testing: add header "x-test-webhook: true" OR use stripe-signature: "t=1234567890,v1=test_signature"`, 400, 'WEBHOOK_VERIFICATION_FAILED');
                }
            }
            console.log(`✅ Received webhook event: ${event.type} (${event.id || 'test-id'})`);
            // Process event asynchronously (return 200 immediately to Stripe)
            // In production, consider using a queue (Bull, BullMQ, etc.)
            stripe_service_1.default.processWebhookEvent(event).catch(err => {
                console.error('Error processing webhook event:', err);
            });
            // Acknowledge receipt of event
            res.status(200).json({ received: true });
        }));
        /**
         * GET /api/v1/stripe/payment-status/:paymentIntentId
         * Get payment status for a PaymentIntent
         */
        this.getPaymentStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.userId;
            const { paymentIntentId } = req.params;
            if (!paymentIntentId || typeof paymentIntentId !== 'string') {
                throw new AppError_1.default('paymentIntentId is required', 400, 'INVALID_REQUEST');
            }
            const status = yield stripe_service_1.default.getPaymentStatus(paymentIntentId, userId);
            res.status(200).json({
                success: true,
                data: status,
            });
        }));
        /**
         * POST /api/v1/stripe/refund
         * Create a refund for an order (Admin/Provider only)
         */
        this.createRefund = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { orderId, reason } = req.body;
            if (!orderId) {
                throw new AppError_1.default('orderId is required', 400, 'INVALID_REQUEST');
            }
            const refund = yield stripe_service_1.default.createRefund(orderId, reason);
            res.status(200).json({
                success: true,
                message: 'Refund created successfully',
                data: refund,
            });
        }));
        /**
         * GET /api/v1/stripe/config
         * Get Stripe publishable key for frontend
         */
        this.getConfig = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            res.status(200).json({
                success: true,
                data: {
                    publishableKey: config_1.default.stripe.publishableKey,
                },
            });
        }));
    }
}
exports.default = new StripeController();
