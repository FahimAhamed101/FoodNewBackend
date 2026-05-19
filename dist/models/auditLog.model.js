"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = exports.RiskLevel = exports.AuditEventType = void 0;
const mongoose_1 = require("mongoose");
var AuditEventType;
(function (AuditEventType) {
    // Authentication events
    AuditEventType["LOGIN_SUCCESS"] = "LOGIN_SUCCESS";
    AuditEventType["LOGIN_FAILED"] = "LOGIN_FAILED";
    AuditEventType["LOGOUT"] = "LOGOUT";
    AuditEventType["TOKEN_REFRESH"] = "TOKEN_REFRESH";
    AuditEventType["TOKEN_REVOKED"] = "TOKEN_REVOKED";
    // Google OAuth events
    AuditEventType["GOOGLE_AUTH_SUCCESS"] = "GOOGLE_AUTH_SUCCESS";
    AuditEventType["GOOGLE_AUTH_FAILED"] = "GOOGLE_AUTH_FAILED";
    AuditEventType["GOOGLE_TOKEN_INVALID"] = "GOOGLE_TOKEN_INVALID";
    // Account events
    AuditEventType["ACCOUNT_CREATED"] = "ACCOUNT_CREATED";
    AuditEventType["ACCOUNT_SUSPENDED"] = "ACCOUNT_SUSPENDED";
    AuditEventType["ACCOUNT_REACTIVATED"] = "ACCOUNT_REACTIVATED";
    AuditEventType["EMAIL_VERIFIED"] = "EMAIL_VERIFIED";
    // Role & Permission events
    AuditEventType["ROLE_ASSIGNED"] = "ROLE_ASSIGNED";
    AuditEventType["ROLE_CHANGED"] = "ROLE_CHANGED";
    AuditEventType["PROVIDER_APPROVED"] = "PROVIDER_APPROVED";
    AuditEventType["PROVIDER_REJECTED"] = "PROVIDER_REJECTED";
    // Step-up verification
    AuditEventType["STEP_UP_REQUIRED"] = "STEP_UP_REQUIRED";
    AuditEventType["STEP_UP_SUCCESS"] = "STEP_UP_SUCCESS";
    AuditEventType["STEP_UP_FAILED"] = "STEP_UP_FAILED";
    // Security events
    AuditEventType["SUSPICIOUS_LOGIN"] = "SUSPICIOUS_LOGIN";
    AuditEventType["LOCATION_CHANGE"] = "LOCATION_CHANGE";
    AuditEventType["MULTIPLE_FAILED_ATTEMPTS"] = "MULTIPLE_FAILED_ATTEMPTS";
    AuditEventType["TOKEN_REUSE_DETECTED"] = "TOKEN_REUSE_DETECTED";
    AuditEventType["SESSION_HIJACK_SUSPECTED"] = "SESSION_HIJACK_SUSPECTED";
    // Provider-specific actions
    AuditEventType["PROVIDER_ACTION"] = "PROVIDER_ACTION";
    // Business & Activity events
    AuditEventType["ORDER_PLACED"] = "ORDER_PLACED";
    AuditEventType["ORDER_STATUS_CHANGED"] = "ORDER_STATUS_CHANGED";
    AuditEventType["MENU_ITEM_CREATED"] = "MENU_ITEM_CREATED";
    AuditEventType["MENU_ITEM_UPDATED"] = "MENU_ITEM_UPDATED";
    AuditEventType["MENU_ITEM_DELETED"] = "MENU_ITEM_DELETED";
    AuditEventType["REVIEW_SUBMITTED"] = "REVIEW_SUBMITTED";
})(AuditEventType || (exports.AuditEventType = AuditEventType = {}));
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["LOW"] = "LOW";
    RiskLevel["MEDIUM"] = "MEDIUM";
    RiskLevel["HIGH"] = "HIGH";
    RiskLevel["CRITICAL"] = "CRITICAL";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
const auditLogSchema = new mongoose_1.Schema({
    eventType: {
        type: String,
        enum: Object.values(AuditEventType),
        required: true,
        index: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    email: {
        type: String,
        lowercase: true,
        index: true,
    },
    action: {
        type: String,
        required: true,
    },
    resource: {
        type: String,
    },
    result: {
        type: String,
        enum: ['success', 'failure'],
        required: true,
        index: true,
    },
    errorMessage: {
        type: String,
    },
    // Security context
    ipAddress: {
        type: String,
        index: true,
    },
    userAgent: {
        type: String,
    },
    deviceId: {
        type: String,
        index: true,
    },
    country: {
        type: String,
    },
    city: {
        type: String,
    },
    // Risk assessment
    riskLevel: {
        type: String,
        enum: Object.values(RiskLevel),
        default: RiskLevel.LOW,
        index: true,
    },
    riskFactors: {
        type: [String],
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
// Compound indexes for common queries
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ eventType: 1, timestamp: -1 });
auditLogSchema.index({ riskLevel: 1, timestamp: -1 });
auditLogSchema.index({ ipAddress: 1, timestamp: -1 });
// TTL index - auto-delete logs older than 90 days (configurable)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
exports.AuditLog = (0, mongoose_1.model)('AuditLog', auditLogSchema);
