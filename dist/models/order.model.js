"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = exports.PaymentStatus = exports.OrderStatus = void 0;
const mongoose_1 = require("mongoose");
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["PREPARING"] = "preparing";
    OrderStatus["READY_FOR_PICKUP"] = "ready_for_pickup";
    OrderStatus["PICKED_UP"] = "picked_up";
    OrderStatus["COMPLETED"] = "completed";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PROCESSING"] = "processing";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
const orderSchema = new mongoose_1.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true,
    },
    providerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [
        {
            foodId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Food' },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            platformFee: { type: Number, default: 0 },
        },
    ],
    subtotal: {
        type: Number,
        required: true,
    },
    platformFee: {
        type: Number,
        default: 0,
    },
    stateTax: {
        type: Number,
        default: 0,
    },
    isDonation: {
        type: Boolean,
        default: false,
        index: true,
    },
    donationAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    vendorAmount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: Object.values(OrderStatus),
        default: OrderStatus.PENDING,
    },
    paymentStatus: {
        type: String,
        enum: Object.values(PaymentStatus),
        default: PaymentStatus.PENDING,
        index: true,
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    logisticsType: {
        type: String,
        required: true,
    },
    cancellationReason: {
        type: String,
        trim: true,
    },
    pickupTime: {
        type: Date,
    },
    state: {
        type: String,
        index: true,
    },
    stripePaymentIntentId: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
    },
    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
    },
    orderStatusHistory: [
        {
            status: {
                type: String,
                enum: Object.values(OrderStatus),
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
        },
    ],
}, {
    timestamps: true,
});
orderSchema.index({ providerId: 1, status: 1, createdAt: -1 });
orderSchema.index({ customerId: 1, status: 1, createdAt: -1 });
orderSchema.index({ createdAt: 1 });
orderSchema.index({ donationAmount: 1, providerId: 1 });
orderSchema.index({ providerId: 1, createdAt: -1 });
exports.Order = (0, mongoose_1.model)('Order', orderSchema);
