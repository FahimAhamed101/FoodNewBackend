"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReviewsQuerySchema = exports.updateReviewSchema = exports.replyReviewSchema = exports.createReviewSchema = void 0;
const zod_1 = require("zod");
exports.createReviewSchema = zod_1.z.object({
    body: zod_1.z.object({
        orderId: zod_1.z.string().min(1, 'Order ID is required'),
        foodId: zod_1.z.string().optional(),
        rating: zod_1.z.number().int().min(1).max(5),
        comment: zod_1.z.string().trim().min(5).max(500),
    }),
});
exports.replyReviewSchema = zod_1.z.object({
    body: zod_1.z.object({
        comment: zod_1.z.string().trim().min(2).max(500),
    }),
});
exports.updateReviewSchema = zod_1.z.object({
    body: zod_1.z.object({
        rating: zod_1.z.number().int().min(1).max(5).optional(),
        comment: zod_1.z.string().trim().min(5).max(500).optional(),
    }),
});
exports.getReviewsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        rating: zod_1.z.string().regex(/^[1-5]|all$/).optional(),
        customerName: zod_1.z.string().trim().optional(),
        page: zod_1.z.string().regex(/^\d+$/).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).optional().default('10'),
    }),
});
