"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeedSchema = void 0;
const zod_1 = require("zod");
exports.getFeedSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        categoryName: zod_1.z.string().optional(),
        providerId: zod_1.z.string().optional(),
    }),
});
