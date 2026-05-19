"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelOrderSchema = exports.createOrderSchema = exports.getOrdersQuerySchema = void 0;
const zod_1 = require("zod");
const donationAmountSchema = zod_1.z.number()
    .finite('Donation amount must be a valid number')
    .min(0, 'Donation amount cannot be negative')
    .max(10000, 'Donation amount is too large')
    .optional()
    .default(0);
exports.getOrdersQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        orderId: zod_1.z.string().optional(),
        customerName: zod_1.z.string().trim().min(2).max(50).optional(),
        status: zod_1.z.enum(['pending', 'preparing', 'ready_for_pickup', 'picked_up', 'cancelled']).optional(),
        page: zod_1.z.string().regex(/^\d+$/).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).optional().default('10'),
    }),
});
exports.createOrderSchema = zod_1.z.object({
    body: zod_1.z.object({
        providerId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Provider ID'),
        items: zod_1.z.array(zod_1.z.object({
            foodId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Food ID'),
            quantity: zod_1.z.number().int().min(1),
            price: zod_1.z.number().min(0),
        })).min(1),
        paymentMethod: zod_1.z.string().min(1),
        logisticsType: zod_1.z.string().min(1),
        donationAmount: donationAmountSchema,
        isDonation: zod_1.z.boolean().optional(),
    }),
});
exports.cancelOrderSchema = zod_1.z.object({
    body: zod_1.z.object({
        reason: zod_1.z.string().min(3).max(500),
    }),
});
