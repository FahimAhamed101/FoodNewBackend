"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const mongoose_1 = require("mongoose");
const sessionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    refreshToken: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    accessToken: {
        type: String,
        required: true,
        index: true,
    },
    deviceId: {
        type: String,
        required: true,
        index: true,
    },
    deviceName: {
        type: String,
    },
    deviceType: {
        type: String,
        enum: ['web', 'mobile', 'tablet', 'desktop'],
    },
    userAgent: {
        type: String,
    },
    ipAddress: {
        type: String,
    },
    country: {
        type: String,
    },
    city: {
        type: String,
    },
    lastActivityAt: {
        type: Date,
        default: Date.now,
    },
    issuedAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 },
    },
    isRevoked: {
        type: Boolean,
        default: false,
        index: true,
    },
    revokedAt: {
        type: Date,
    },
    revokedReason: {
        type: String,
    },
    tokenFamily: {
        type: String,
        required: true,
        index: true,
    },
    previousTokenId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Session',
    },
}, {
    timestamps: true,
});
sessionSchema.index({ userId: 1, isRevoked: 1 });
sessionSchema.index({ userId: 1, deviceId: 1 });
sessionSchema.index({ tokenFamily: 1, isRevoked: 1 });
exports.Session = (0, mongoose_1.model)('Session', sessionSchema);
