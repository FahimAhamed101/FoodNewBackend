"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryIdSchema = exports.updateCategorySchema = exports.createCategorySchema = void 0;
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
exports.createCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        categoryName: zod_1.z
            .string()
            .trim()
            .min(2, 'Category name must be at least 2 characters')
            .max(50, 'Category name cannot exceed 50 characters'),
        image: zod_1.z.string().optional(),
        categoryStatus: booleanFromForm.optional(),
    }),
});
exports.updateCategorySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Category ID'),
    }),
    body: zod_1.z.object({
        categoryName: zod_1.z
            .string()
            .trim()
            .min(2, 'Category name must be at least 2 characters')
            .max(50, 'Category name cannot exceed 50 characters')
            .optional(),
        categoryStatus: booleanFromForm.optional(),
        image: zod_1.z.string().optional(),
    }),
});
exports.categoryIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Category ID'),
    }),
});
