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
const mongoose_1 = require("mongoose");
const stripe_1 = __importDefault(require("../config/stripe"));
const food_model_1 = require("../models/food.model");
const profile_model_1 = require("../models/profile.model");
const state_model_1 = require("../models/state.model");
const order_model_1 = require("../models/order.model");
const payment_model_1 = require("../models/payment.model");
const webhookEvent_model_1 = require("../models/webhookEvent.model");
const cart_model_1 = require("../models/cart.model");
const notification_service_1 = __importDefault(require("./notification.service"));
const user_model_1 = require("../models/user.model");
const AppError_1 = __importDefault(require("../utils/AppError"));
class StripeService {
    /**
     * Calculate complete price breakdown
     * LOGIC:
     * - Base Price: $5.99 (fixed)
     *   ↳ Restaurant gets: $5.49
     *   ↳ Admin gets: $0.50 (platform fee)
     * - Service Fee: Restaurant sets, restaurant gets
     * - Tax: Calculated on subtotal, admin gets
     * - Customer pays: subtotal + tax
     */
    calculatePriceBreakdown(customerId_1, items_1) {
        return __awaiter(this, arguments, void 0, function* (customerId, items, donationAmount = 0) {
            const safeDonationAmount = this.roundMoney(donationAmount);
            // Fetch food items from DB (NEVER trust frontend prices)
            const foodIds = items.map(item => new mongoose_1.Types.ObjectId(item.foodId));
            const foods = yield food_model_1.Food.find({ _id: { $in: foodIds } });
            if (foods.length !== items.length) {
                throw new AppError_1.default('Some food items not found', 404, 'FOOD_NOT_FOUND');
            }
            // Check availability
            const unavailableFoods = foods.filter(f => !f.foodAvailability || !f.foodStatus);
            if (unavailableFoods.length > 0) {
                throw new AppError_1.default(`Food items unavailable: ${unavailableFoods.map(f => f.title).join(', ')}`, 400, 'FOOD_UNAVAILABLE');
            }
            // Get customer's state for tax
            const customerProfile = yield profile_model_1.Profile.findOne({ userId: new mongoose_1.Types.ObjectId(customerId) });
            let stateTaxRate = 0;
            let customerState = '';
            if (customerProfile && customerProfile.state) {
                customerState = customerProfile.state;
                const stateData = yield state_model_1.State.findOne({
                    $or: [
                        { code: customerProfile.state.toUpperCase() },
                        { name: new RegExp(`^${customerProfile.state}$`, 'i') }
                    ],
                    isActive: true
                });
                if (stateData && stateData.tax) {
                    stateTaxRate = stateData.tax / 100;
                }
            }
            // Platform fee is FIXED $0.50 per item (deducted from baseRevenue)
            const PLATFORM_FEE_PER_ITEM = 0.50;
            // Calculate breakdown
            let subtotal = 0; // baseRevenue + serviceFee (what customer pays before tax)
            let totalPlatformFee = 0; // $0.50 × quantity (admin gets, deducted from baseRevenue)
            let totalVendorRevenue = 0; // (baseRevenue - platformFee) + serviceFee (restaurant gets)
            const itemsBreakdown = items.map(item => {
                const food = foods.find(f => f._id.toString() === item.foodId);
                if (!food)
                    throw new AppError_1.default('Food item not found', 404, 'FOOD_NOT_FOUND');
                // Base price breakdown per item
                const itemBaseRevenue = food.baseRevenue * item.quantity; // $5.99 × qty
                const itemServiceFee = food.serviceFee * item.quantity; // e.g., $1.25 × qty
                const itemPlatformFee = PLATFORM_FEE_PER_ITEM * item.quantity; // $0.50 × qty
                // Customer pays: baseRevenue + serviceFee
                const itemSubtotal = itemBaseRevenue + itemServiceFee;
                // Restaurant gets: (baseRevenue - platformFee) + serviceFee
                const itemVendorRevenue = (itemBaseRevenue - itemPlatformFee) + itemServiceFee;
                subtotal += itemSubtotal;
                totalPlatformFee += itemPlatformFee;
                totalVendorRevenue += itemVendorRevenue;
                return {
                    foodId: food._id.toString(),
                    name: food.title,
                    price: food.finalPriceTag,
                    baseRevenue: food.baseRevenue,
                    serviceFee: food.serviceFee,
                    quantity: item.quantity,
                    itemTotal: parseFloat(itemSubtotal.toFixed(2)),
                    platformFee: parseFloat(itemPlatformFee.toFixed(2)),
                };
            });
            // Tax is calculated on subtotal (baseRevenue + serviceFee)
            const stateTax = subtotal * stateTaxRate;
            // Total customer pays: subtotal + tax + optional donation
            const total = subtotal + stateTax + safeDonationAmount;
            // Restaurant gets: (baseRevenue - platformFee) + serviceFee
            const vendorAmount = totalVendorRevenue;
            return {
                subtotal: parseFloat(subtotal.toFixed(2)),
                platformFee: parseFloat(totalPlatformFee.toFixed(2)),
                stateTax: parseFloat(stateTax.toFixed(2)),
                donationAmount: safeDonationAmount,
                total: parseFloat(total.toFixed(2)),
                vendorAmount: parseFloat(vendorAmount.toFixed(2)),
                state: customerState,
                items: itemsBreakdown,
            };
        });
    }
    /**
     * Create Stripe PaymentIntent
     */
    createPaymentIntent(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { customerId, providerId, items } = data;
            const donationAmount = this.roundMoney(data.donationAmount || 0);
            // Calculate price breakdown (backend-validated prices)
            const breakdown = yield this.calculatePriceBreakdown(customerId, items, donationAmount);
            // Create Stripe PaymentIntent
            const paymentIntent = yield stripe_1.default.paymentIntents.create({
                amount: Math.round(breakdown.total * 100), // Stripe uses cents
                currency: 'usd',
                automatic_payment_methods: {
                    enabled: true,
                },
                metadata: {
                    customerId,
                    providerId,
                    state: breakdown.state,
                    subtotal: breakdown.subtotal.toString(),
                    platformFee: breakdown.platformFee.toString(),
                    stateTax: breakdown.stateTax.toString(),
                    donationAmount: breakdown.donationAmount.toString(),
                    vendorAmount: breakdown.vendorAmount.toString(),
                    items: JSON.stringify(items),
                    isDonation: data.isDonation ? 'true' : 'false',
                },
                description: `Order from EMDR - Provider: ${providerId}`,
            });
            return {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                amount: breakdown.total,
                breakdown,
            };
        });
    }
    /**
     * Handle successful payment webhook
     */
    handlePaymentSuccess(paymentIntent) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`💰 [Stripe Webhook] Processing success for PaymentIntent: ${paymentIntent.id}`);
            const metadata = paymentIntent.metadata;
            // Extract metadata
            const customerId = metadata.customerId;
            const providerId = metadata.providerId;
            const state = metadata.state;
            const items = JSON.parse(metadata.items);
            const donationAmount = this.parseDonationAmount(metadata.donationAmount);
            const isDonation = metadata.isDonation === 'true';
            // Recalculate to ensure integrity (prevent metadata tampering)
            const breakdown = yield this.calculatePriceBreakdown(customerId, items, donationAmount);
            // Verify amount matches
            const expectedAmount = Math.round(breakdown.total * 100);
            if (paymentIntent.amount !== expectedAmount) {
                throw new AppError_1.default(`Amount mismatch: expected ${expectedAmount}, got ${paymentIntent.amount}`, 400, 'AMOUNT_MISMATCH');
            }
            // Prepare items with platform fees
            const itemsWithFees = breakdown.items.map(item => ({
                foodId: new mongoose_1.Types.ObjectId(item.foodId),
                quantity: item.quantity,
                price: item.baseRevenue + item.serviceFee, // baseRevenue + serviceFee
                platformFee: item.platformFee,
            }));
            // Create Order
            console.log(`📦 [Stripe Webhook] Creating order for customer ${customerId} from provider ${providerId}`);
            const order = yield order_model_1.Order.create({
                customerId: new mongoose_1.Types.ObjectId(customerId),
                providerId: new mongoose_1.Types.ObjectId(providerId),
                items: itemsWithFees,
                subtotal: breakdown.subtotal,
                platformFee: breakdown.platformFee,
                stateTax: breakdown.stateTax,
                donationAmount: breakdown.donationAmount,
                isDonation: isDonation,
                totalPrice: breakdown.total,
                vendorAmount: breakdown.vendorAmount,
                state,
                status: order_model_1.OrderStatus.PENDING,
                paymentStatus: order_model_1.PaymentStatus.PAID,
                paymentMethod: 'stripe',
                logisticsType: 'delivery',
                orderId: `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                stripePaymentIntentId: paymentIntent.id,
                idempotencyKey: paymentIntent.id,
            });
            console.log(`✅ [Stripe Webhook] Order created: ${order.orderId}`);
            // Create Payment record
            console.log(`💳 [Stripe Webhook] Creating payment record for order ${order.orderId}`);
            yield payment_model_1.Payment.create({
                paymentId: `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                orderId: order.orderId,
                orderObjectId: order._id,
                providerId: new mongoose_1.Types.ObjectId(providerId),
                customerId: new mongoose_1.Types.ObjectId(customerId),
                totalAmount: breakdown.total,
                donationAmount: breakdown.donationAmount,
                commission: breakdown.platformFee,
                netAmount: breakdown.vendorAmount,
                vendorAmount: breakdown.vendorAmount,
                status: payment_model_1.PaymentStatus.COMPLETED,
                payoutStatus: 'pending',
                paymentMethod: 'stripe',
                stripePaymentIntentId: paymentIntent.id,
                stripeChargeId: paymentIntent.latest_charge,
            });
            // Send notifications
            const { title: cTitle, message: cMessage } = notification_service_1.default.getNotificationDetails(order_model_1.OrderStatus.PENDING, order.orderId, user_model_1.UserRole.CUSTOMER);
            yield notification_service_1.default.createNotification(order.customerId, user_model_1.UserRole.CUSTOMER, order._id, order_model_1.OrderStatus.PENDING, cTitle, cMessage);
            const { title: pTitle, message: pMessage } = notification_service_1.default.getNotificationDetails(order_model_1.OrderStatus.PENDING, order.orderId, user_model_1.UserRole.PROVIDER);
            yield notification_service_1.default.createNotification(order.providerId, user_model_1.UserRole.PROVIDER, order._id, order_model_1.OrderStatus.PENDING, pTitle, pMessage);
            // Clear customer's cart
            console.log(`🛒 [Stripe Webhook] Clearing cart for customer ${customerId}`);
            yield cart_model_1.Cart.findOneAndUpdate({ userId: new mongoose_1.Types.ObjectId(customerId) }, { $set: { items: [] } });
            console.log(`🎉 [Stripe Webhook] Payment success flow completed for ${order.orderId}`);
            return order;
        });
    }
    /**
     * Handle failed payment webhook
     */
    handlePaymentFailed(paymentIntent) {
        return __awaiter(this, void 0, void 0, function* () {
            // Log failed payment for analytics
            console.error('Payment failed:', {
                paymentIntentId: paymentIntent.id,
                customerId: paymentIntent.metadata.customerId,
                amount: paymentIntent.amount,
                error: paymentIntent.last_payment_error,
            });
            // Optionally: Send notification to customer about failed payment
            // This can be implemented based on business requirements
        });
    }
    /**
     * Process webhook event with idempotency
     */
    processWebhookEvent(event) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`📫 [Stripe Webhook] Received event type: ${event.type}`);
            // Check if event already processed (idempotency)
            const existingEvent = yield webhookEvent_model_1.WebhookEvent.findOne({ eventId: event.id });
            if (existingEvent && existingEvent.processed) {
                console.log(`Webhook event ${event.id} already processed, skipping`);
                return { alreadyProcessed: true };
            }
            // Store event
            yield webhookEvent_model_1.WebhookEvent.create({
                eventId: event.id,
                type: event.type,
                processed: false,
                data: event.data,
            });
            let result;
            // Handle event types
            switch (event.type) {
                case 'payment_intent.succeeded':
                    const paymentIntent = event.data.object;
                    result = yield this.handlePaymentSuccess(paymentIntent);
                    break;
                case 'payment_intent.payment_failed':
                    const failedIntent = event.data.object;
                    yield this.handlePaymentFailed(failedIntent);
                    result = { status: 'failed' };
                    break;
                default:
                    console.log(`Unhandled event type: ${event.type}`);
                    result = { status: 'unhandled' };
            }
            // Mark event as processed
            yield webhookEvent_model_1.WebhookEvent.findOneAndUpdate({ eventId: event.id }, { processed: true, processedAt: new Date() });
            return result;
        });
    }
    /**
     * Get payment status
     */
    getPaymentStatus(paymentIntentId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const paymentIntent = yield stripe_1.default.paymentIntents.retrieve(paymentIntentId);
            // Find associated order
            const order = yield order_model_1.Order.findOne({ stripePaymentIntentId: paymentIntentId });
            // Verify user has access
            if (order && order.customerId.toString() !== userId) {
                throw new AppError_1.default('Not authorized to view this payment', 403, 'ACCESS_DENIED');
            }
            return {
                status: paymentIntent.status,
                amount: paymentIntent.amount / 100,
                orderId: order === null || order === void 0 ? void 0 : order.orderId,
                orderStatus: order === null || order === void 0 ? void 0 : order.status,
                paymentStatus: order === null || order === void 0 ? void 0 : order.paymentStatus,
                donationAmount: (order === null || order === void 0 ? void 0 : order.donationAmount) || Number(((_a = paymentIntent.metadata) === null || _a === void 0 ? void 0 : _a.donationAmount) || 0),
            };
        });
    }
    /**
     * Create refund (for admin/provider)
     */
    createRefund(orderId, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield order_model_1.Order.findOne({ orderId });
            if (!order) {
                throw new AppError_1.default('Order not found', 404, 'ORDER_NOT_FOUND');
            }
            if (!order.stripePaymentIntentId) {
                throw new AppError_1.default('No payment intent found for this order', 400, 'NO_PAYMENT_INTENT');
            }
            if (order.paymentStatus === order_model_1.PaymentStatus.REFUNDED) {
                throw new AppError_1.default('Order already refunded', 400, 'ALREADY_REFUNDED');
            }
            // Create refund in Stripe
            const refund = yield stripe_1.default.refunds.create({
                payment_intent: order.stripePaymentIntentId,
                reason: reason === 'duplicate' ? 'duplicate' : 'requested_by_customer',
            });
            // Update order
            order.paymentStatus = order_model_1.PaymentStatus.REFUNDED;
            order.status = order_model_1.OrderStatus.CANCELLED;
            order.cancellationReason = reason || 'Refunded';
            yield order.save();
            // Update payment record
            yield payment_model_1.Payment.findOneAndUpdate({ stripePaymentIntentId: order.stripePaymentIntentId }, { status: payment_model_1.PaymentStatus.REFUNDED });
            return {
                refundId: refund.id,
                amount: refund.amount / 100,
                status: refund.status,
            };
        });
    }
    roundMoney(value) {
        return Number.isFinite(value) ? parseFloat(value.toFixed(2)) : 0;
    }
    parseDonationAmount(value) {
        return this.roundMoney(Number(value || 0));
    }
}
exports.default = new StripeService();
