"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeedSchema = exports.removeFavoriteSchema = exports.createFavoriteSchema = void 0;
const zod_1 = require("zod");
exports.createFavoriteSchema = zod_1.z.object({
    body: zod_1.z.object({
        foodId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Food ID'),
    }),
});
exports.removeFavoriteSchema = zod_1.z.object({
    params: zod_1.z.object({
        foodId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Food ID'),
    }),
});
exports.getFeedSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).optional(),
        limit: zod_1.z.string().transform(Number).optional(),
    }),
});
