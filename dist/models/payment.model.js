"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = exports.PayoutStatus = exports.PaymentStatus = void 0;
const mongoose_1 = require("mongoose");
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["COMPLETED"] = "completed";
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PayoutStatus;
(function (PayoutStatus) {
    PayoutStatus["PENDING"] = "pending";
    PayoutStatus["SETTLED"] = "settled";
})(PayoutStatus || (exports.PayoutStatus = PayoutStatus = {}));
const paymentSchema = new mongoose_1.Schema({
    paymentId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    orderId: {
        type: String,
        required: true,
        index: true,
    },
    orderObjectId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    providerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    donationAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    commission: {
        type: Number,
        required: true,
        default: 0,
    },
    netAmount: {
        type: Number,
        required: true,
    },
    vendorAmount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: Object.values(PaymentStatus),
        default: PaymentStatus.PENDING,
        index: true,
    },
    payoutStatus: {
        type: String,
        enum: Object.values(PayoutStatus),
        default: PayoutStatus.PENDING,
        index: true,
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    stripePaymentIntentId: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
    },
    stripeChargeId: {
        type: String,
    },
    stripeTransferId: {
        type: String,
    },
}, {
    timestamps: true,
});
// Compound index for provider-isolated searches
paymentSchema.index({ providerId: 1, paymentId: 1 });
paymentSchema.index({ providerId: 1, orderId: 1 });
paymentSchema.index({ providerId: 1, status: 1, createdAt: -1 });
exports.Payment = (0, mongoose_1.model)('Payment', paymentSchema);
