"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBannersQuerySchema = exports.updateBannerSchema = exports.createBannerSchema = void 0;
const zod_1 = require("zod");
const banner_model_1 = require("../models/banner.model");
exports.createBannerSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().trim().min(3).max(100),
        bannerImage: zod_1.z.string().url('Invalid image URL'),
        startTime: zod_1.z.string().regex(/^\d{2}-\d{2}-\d{4}$/, 'Invalid date format (DD-MM-YYYY)'),
        endTime: zod_1.z.string().regex(/^\d{2}-\d{2}-\d{4}$/, 'Invalid date format (DD-MM-YYYY)'),
        status: zod_1.z.nativeEnum(banner_model_1.BannerStatus).optional(),
    }).refine((data) => {
        const [sDay, sMonth, sYear] = data.startTime.split('-').map(Number);
        const [eDay, eMonth, eYear] = data.endTime.split('-').map(Number);
        const start = new Date(sYear, sMonth - 1, sDay);
        const end = new Date(eYear, eMonth - 1, eDay);
        return start < end;
    }, {
        message: "End time must be after start time",
        path: ["endTime"],
    }),
});
exports.updateBannerSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().trim().min(3).max(100).optional(),
        bannerImage: zod_1.z.string().url().optional(),
        startTime: zod_1.z.string().regex(/^\d{2}-\d{2}-\d{4}$/, 'Invalid date format (DD-MM-YYYY)').optional(),
        endTime: zod_1.z.string().regex(/^\d{2}-\d{2}-\d{4}$/, 'Invalid date format (DD-MM-YYYY)').optional(),
        status: zod_1.z.nativeEnum(banner_model_1.BannerStatus).optional(),
    }).refine((data) => {
        if (data.startTime && data.endTime) {
            const [sDay, sMonth, sYear] = data.startTime.split('-').map(Number);
            const [eDay, eMonth, eYear] = data.endTime.split('-').map(Number);
            const start = new Date(sYear, sMonth - 1, sDay);
            const end = new Date(eYear, eMonth - 1, eDay);
            return start < end;
        }
        return true;
    }, {
        message: "End time must be after start time",
        path: ["endTime"],
    }),
});
exports.getBannersQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        status: zod_1.z.nativeEnum(banner_model_1.BannerStatus).optional(),
        search: zod_1.z.string().optional(),
        page: zod_1.z.string().optional().default('1'),
        limit: zod_1.z.string().optional().default('10'),
    }),
});
