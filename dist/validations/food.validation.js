"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFoodsQuerySchema = exports.foodByCategorySchema = exports.foodIdSchema = exports.updateFoodSchema = exports.createFoodSchema = void 0;
const zod_1 = require("zod");
const booleanFromForm = zod_1.z.preprocess((value) => {
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true')
            return true;
        if (normalized === 'false')
            return false;
    }
    return value;
}, zod_1.z.boolean());
exports.createFoodSchema = zod_1.z.object({
    body: zod_1.z.object({
        categoryId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Category ID'),
        title: zod_1.z
            .string()
            .trim()
            .min(2, 'Title must be at least 2 characters')
            .max(100, 'Title cannot exceed 100 characters'),
        foodAvailability: booleanFromForm.optional(),
        calories: zod_1.z.coerce.number().min(0, 'Calories cannot be negative'),
        productDescription: zod_1.z.string().optional(),
        baseRevenue: zod_1.z.coerce.number().min(0, 'Base revenue cannot be negative'),
        serviceFee: zod_1.z.coerce.number().min(0, 'Service fee cannot be negative'),
        foodStatus: booleanFromForm.optional(),
    }),
});
exports.updateFoodSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Food ID'),
    }),
    body: zod_1.z.object({
        categoryId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Category ID').optional(),
        title: zod_1.z
            .string()
            .trim()
            .min(2, 'Title must be at least 2 characters')
            .max(100, 'Title cannot exceed 100 characters')
            .optional(),
        foodAvailability: booleanFromForm.optional(),
        calories: zod_1.z.coerce.number().min(0, 'Calories cannot be negative').optional(),
        productDescription: zod_1.z.string().optional(),
        baseRevenue: zod_1.z.coerce.number().min(0, 'Base revenue cannot be negative').optional(),
        serviceFee: zod_1.z.coerce.number().min(0, 'Service fee cannot be negative').optional(),
        foodStatus: booleanFromForm.optional(),
    }),
});
exports.foodIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Food ID'),
    }),
});
exports.foodByCategorySchema = zod_1.z.object({
    params: zod_1.z.object({
        categoryId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Category ID'),
    }),
});
exports.getFoodsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        categoryId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Category ID').optional(),
        categoryName: zod_1.z.string().trim().min(2).max(50).optional(),
        status: zod_1.z.enum(['all', 'active', 'inactive']).optional().default('all'),
        page: zod_1.z.string().regex(/^\d+$/).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).optional().default('10'),
    }),
});
