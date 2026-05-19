"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromCartSchema = exports.updateCartItemSchema = exports.addToCartSchema = void 0;
const zod_1 = require("zod");
exports.addToCartSchema = zod_1.z.object({
    body: zod_1.z.object({
        foodId: zod_1.z.string().min(1, 'Food ID is required'),
        quantity: zod_1.z.number().int().min(1, 'Quantity must be at least 1').default(1),
    }),
});
exports.updateCartItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        foodId: zod_1.z.string().min(1, 'Food ID is required'),
        quantity: zod_1.z.number().int().min(0, 'Quantity cannot be negative'),
    }),
});
exports.removeFromCartSchema = zod_1.z.object({
    body: zod_1.z.object({
        foodId: zod_1.z.string().min(1, 'Food ID is required'),
    }),
});
