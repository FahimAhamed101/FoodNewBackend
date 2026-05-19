"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopFoodsSchema = exports.getTopRestaurantsSchema = void 0;
const zod_1 = require("zod");
exports.getTopRestaurantsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        minRating: zod_1.z.string().optional(),
    }),
});
exports.getTopFoodsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        minRating: zod_1.z.string().optional(),
        providerId: zod_1.z.string().optional(),
    }),
});
