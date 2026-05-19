"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
const phoneRegex = /^\+?[1-9]\d{1,14}$/;
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().trim().min(2).max(100).optional(),
        phone: zod_1.z.string().trim().regex(phoneRegex, 'Invalid phone number format').optional(),
        dateOfBirth: zod_1.z.string().transform((val) => new Date(val)).optional(),
        address: zod_1.z.string().trim().min(5).optional(),
        city: zod_1.z.string().trim().min(2).max(100).optional(),
        state: zod_1.z.string().trim().min(2).max(100).optional(),
        profilePic: zod_1.z.string().url('Invalid profile picture URL').optional().or(zod_1.z.literal('')),
        avatar: zod_1.z.string().url('Invalid avatar URL').optional().or(zod_1.z.literal('')),
        Boi: zod_1.z.string().trim().max(500).optional(), // Admin dash field with typo
    }),
});
