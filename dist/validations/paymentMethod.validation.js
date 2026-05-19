"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentMethodIdSchema = exports.addPaymentMethodSchema = void 0;
const zod_1 = require("zod");
exports.addPaymentMethodSchema = zod_1.z.object({
    body: zod_1.z.object({
        cardholderName: zod_1.z.string().trim().min(2, 'Cardholder name is required'),
        cardNumber: zod_1.z.string()
            .regex(/^\d{16}$/, 'Card number must be 16 digits'),
        expiryDate: zod_1.z.string()
            .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry date must be in MM/YY format'),
        cvv: zod_1.z.string()
            .regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
        isDefault: zod_1.z.boolean().optional().default(false),
    }),
});
exports.paymentMethodIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment method ID format'),
    }),
});
