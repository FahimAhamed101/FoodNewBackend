"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentStatusSchema = exports.refundSchema = exports.createPaymentIntentSchema = void 0;
const zod_1 = require("zod");
const donationAmountSchema = zod_1.z.number()
    .finite('Donation amount must be a valid number')
    .min(0, 'Donation amount cannot be negative')
    .max(10000, 'Donation amount is too large')
    .optional()
    .default(0);
exports.createPaymentIntentSchema = zod_1.z.object({
    body: zod_1.z.object({
        providerId: zod_1.z.string().min(1, 'Provider ID is required'),
        items: zod_1.z.array(zod_1.z.object({
            foodId: zod_1.z.string().min(1, 'Food ID is required'),
            quantity: zod_1.z.number().int().min(1, 'Quantity must be at least 1'),
        })).min(1, 'At least one item is required'),
        donationAmount: donationAmountSchema,
        isDonation: zod_1.z.boolean().optional(),
    }),
});
exports.refundSchema = zod_1.z.object({
    body: zod_1.z.object({
        orderId: zod_1.z.string().min(1, 'Order ID is required'),
        reason: zod_1.z.string().optional(),
    }),
});
exports.paymentStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        paymentIntentId: zod_1.z.string().min(1, 'Payment Intent ID is required'),
    }),
});
