"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.resendVerificationSchema = exports.verifyForgotOtpSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.verifyEmailSchema = exports.loginSchema = exports.providerSignupSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
exports.signupSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z
            .string()
            .trim()
            .min(2, 'Name must be at least 2 characters')
            .max(50, 'Name cannot exceed 50 characters'),
        email: zod_1.z
            .string()
            .trim()
            .email('Invalid email format'),
        password: zod_1.z
            .string()
            .min(6, 'Password must be at least 6 characters')
            .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
            .regex(/[0-9]/, 'Password must contain at least one number'),
        role: zod_1.z.enum(['CUSTOMER', 'PROVIDER', 'ADMIN']).optional(),
    }),
});
exports.providerSignupSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().trim().email('Invalid email format'),
        password: zod_1.z.string().min(6).regex(/[a-zA-Z]/).regex(/[0-9]/),
        streetAddress: zod_1.z.string().trim().min(2).optional().default(''),
        state: zod_1.z.string().trim().min(2).optional().default(''),
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string()
            .trim()
            .email('Invalid email format'),
        password: zod_1.z
            .string()
            .min(1, 'Password is required'),
    }),
});
exports.verifyEmailSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string()
            .trim()
            .email('Invalid email format'),
        otp: zod_1.z
            .string()
            .length(6, 'OTP must be exactly 6 digits'),
    }),
});
exports.forgotPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string()
            .trim()
            .email('Invalid email format'),
    }),
});
exports.resetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        newPassword: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: zod_1.z.string(),
    }).refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    }),
});
exports.verifyForgotOtpSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().trim().email('Invalid email format'),
        otp: zod_1.z.string().length(6, 'OTP must be exactly 6 digits'),
    }),
});
exports.resendVerificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().trim().email('Invalid email format'),
    }),
});
exports.changePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string().min(1, 'Current password is required'),
        newPassword: zod_1.z.string().min(6, 'Password must be at least 6 characters').regex(/[a-zA-Z]/, 'Password must contain at least one letter').regex(/[0-9]/, 'Password must contain at least one number'),
        confirmNewPassword: zod_1.z.string()
    }).refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "Passwords don't match",
        path: ['confirmNewPassword'],
    }),
});
