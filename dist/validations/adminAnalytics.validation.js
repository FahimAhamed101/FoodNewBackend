"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recentOrdersQuerySchema = exports.analyticsQuerySchema = void 0;
const zod_1 = require("zod");
exports.analyticsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        filter: zod_1.z.enum(['today', 'week', 'month', 'year', 'custom']).default('today'),
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
    }).refine(data => {
        if (data.filter === 'custom' && (!data.startDate || !data.endDate)) {
            return false;
        }
        return true;
    }, {
        message: 'startDate and endDate are required for custom filter',
        path: ['startDate']
    }),
});
exports.recentOrdersQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).optional().default('10'),
    }),
});
