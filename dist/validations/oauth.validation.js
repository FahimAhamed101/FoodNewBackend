"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenValidation = exports.stepUpValidation = exports.googleAuthValidation = void 0;
const zod_1 = require("zod");
const user_model_1 = require("../models/user.model");
/**
 * Google OAuth Authentication Validation
 */
exports.googleAuthValidation = zod_1.z.object({
    body: zod_1.z.object({
        idToken: zod_1.z.string().min(1, 'Google idToken cannot be empty'),
        requestedRole: zod_1.z.nativeEnum(user_model_1.UserRole).refine((val) => val === user_model_1.UserRole.CUSTOMER || val === user_model_1.UserRole.PROVIDER, { message: 'Role must be either CUSTOMER or PROVIDER' }),
    }),
});
/**
 * Step-Up Verification Validation
 */
exports.stepUpValidation = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
        otp: zod_1.z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only digits'),
    }),
});
/**
 * Refresh Token Validation
 */
exports.refreshTokenValidation = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1, 'Refresh token cannot be empty'),
    }),
});
