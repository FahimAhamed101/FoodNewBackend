"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nearbyDonatedFoodsSchema = exports.nearbyProvidersQuerySchema = exports.nearbyProvidersSchema = void 0;
const zod_1 = require("zod");
const sortBySchema = zod_1.z
    .enum(['distance', 'rating', 'name'])
    .optional()
    .default('distance');
const parseQueryNumber = (value) => {
    const rawValue = Array.isArray(value) ? value[0] : value;
    if (rawValue === undefined || rawValue === null || rawValue === '') {
        return undefined;
    }
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : undefined;
};
/**
 * Validation schema for nearby providers search
 */
exports.nearbyProvidersSchema = zod_1.z.object({
    body: zod_1.z.object({
        latitude: zod_1.z
            .number()
            .min(-90, 'Latitude must be between -90 and 90')
            .max(90, 'Latitude must be between -90 and 90'),
        longitude: zod_1.z
            .number()
            .min(-180, 'Longitude must be between -180 and 180')
            .max(180, 'Longitude must be between -180 and 180'),
        radius: zod_1.z
            .number()
            .positive('Radius must be a positive number')
            .max(100, 'Radius cannot exceed 100 km')
            .optional()
            .default(3), // Default 3 km radius
        page: zod_1.z
            .number()
            .int()
            .positive()
            .optional()
            .default(1),
        limit: zod_1.z
            .number()
            .int()
            .positive()
            .max(100, 'Limit cannot exceed 100')
            .optional()
            .default(20),
        cuisine: zod_1.z
            .string()
            .optional(),
        sortBy: sortBySchema
    })
});
exports.nearbyProvidersQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        latitude: zod_1.z.preprocess(parseQueryNumber, zod_1.z
            .number()
            .min(-90, 'Latitude must be between -90 and 90')
            .max(90, 'Latitude must be between -90 and 90')
            .optional()),
        longitude: zod_1.z.preprocess(parseQueryNumber, zod_1.z
            .number()
            .min(-180, 'Longitude must be between -180 and 180')
            .max(180, 'Longitude must be between -180 and 180')
            .optional()),
        radius: zod_1.z.preprocess(parseQueryNumber, zod_1.z
            .number()
            .positive('Radius must be a positive number')
            .max(100, 'Radius cannot exceed 100 km')
            .optional()
            .default(10)),
        page: zod_1.z.preprocess(parseQueryNumber, zod_1.z
            .number()
            .int()
            .positive()
            .optional()
            .default(1)),
        limit: zod_1.z.preprocess(parseQueryNumber, zod_1.z
            .number()
            .int()
            .positive()
            .max(100, 'Limit cannot exceed 100')
            .optional()
            .default(100)),
        cuisine: zod_1.z
            .string()
            .optional(),
        sortBy: sortBySchema
    })
});
exports.nearbyDonatedFoodsSchema = zod_1.z.object({
    body: zod_1.z.object({
        latitude: zod_1.z.preprocess(parseQueryNumber, zod_1.z
            .number()
            .min(-90, 'Latitude must be between -90 and 90')
            .max(90, 'Latitude must be between -90 and 90')
            .optional()),
        longitude: zod_1.z.preprocess(parseQueryNumber, zod_1.z
            .number()
            .min(-180, 'Longitude must be between -180 and 180')
            .max(180, 'Longitude must be between -180 and 180')
            .optional()),
        radius: zod_1.z.preprocess(parseQueryNumber, zod_1.z
            .number()
            .positive('Radius must be a positive number')
            .max(100, 'Radius cannot exceed 100 km')
            .optional()
            .default(10)),
        page: zod_1.z.preprocess(parseQueryNumber, zod_1.z
            .number()
            .int()
            .positive()
            .optional()
            .default(1)),
        limit: zod_1.z.preprocess(parseQueryNumber, zod_1.z
            .number()
            .int()
            .positive()
            .max(100, 'Limit cannot exceed 100')
            .optional()
            .default(100)),
        cuisine: zod_1.z
            .string()
            .optional(),
        sortBy: sortBySchema
    })
});
