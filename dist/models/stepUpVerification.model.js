"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepUpVerification = exports.StepUpStatus = exports.StepUpMethod = exports.StepUpPurpose = void 0;
const mongoose_1 = require("mongoose");
var StepUpPurpose;
(function (StepUpPurpose) {
    StepUpPurpose["PROVIDER_FIRST_LOGIN"] = "PROVIDER_FIRST_LOGIN";
    StepUpPurpose["PROVIDER_ROLE_UPGRADE"] = "PROVIDER_ROLE_UPGRADE";
    StepUpPurpose["SENSITIVE_ACTION"] = "SENSITIVE_ACTION";
    StepUpPurpose["LOCATION_CHANGE"] = "LOCATION_CHANGE";
    StepUpPurpose["DEVICE_CHANGE"] = "DEVICE_CHANGE";
})(StepUpPurpose || (exports.StepUpPurpose = StepUpPurpose = {}));
var StepUpMethod;
(function (StepUpMethod) {
    StepUpMethod["EMAIL_OTP"] = "EMAIL_OTP";
    StepUpMethod["SMS_OTP"] = "SMS_OTP";
    StepUpMethod["ADMIN_APPROVAL"] = "ADMIN_APPROVAL";
    StepUpMethod["RE_AUTHENTICATION"] = "RE_AUTHENTICATION";
})(StepUpMethod || (exports.StepUpMethod = StepUpMethod = {}));
var StepUpStatus;
(function (StepUpStatus) {
    StepUpStatus["PENDING"] = "PENDING";
    StepUpStatus["VERIFIED"] = "VERIFIED";
    StepUpStatus["FAILED"] = "FAILED";
    StepUpStatus["EXPIRED"] = "EXPIRED";
})(StepUpStatus || (exports.StepUpStatus = StepUpStatus = {}));
const stepUpVerificationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    purpose: {
        type: String,
        enum: Object.values(StepUpPurpose),
        required: true,
    },
    method: {
        type: String,
        enum: Object.values(StepUpMethod),
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(StepUpStatus),
        default: StepUpStatus.PENDING,
        index: true,
    },
    // OTP fields
    otp: {
        type: String,
    },
    otpAttempts: {
        type: Number,
        default: 0,
    },
    maxOtpAttempts: {
        type: Number,
        default: 3,
    },
    // Admin approval
    approvedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    approvalNotes: {
        type: String,
    },
    // Metadata
    requestedAction: {
        type: String,
    },
    ipAddress: {
        type: String,
    },
    deviceId: {
        type: String,
    },
    // Timestamps
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }, // TTL index
    },
    verifiedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Compound indexes
stepUpVerificationSchema.index({ userId: 1, status: 1 });
stepUpVerificationSchema.index({ userId: 1, purpose: 1, status: 1 });
exports.StepUpVerification = (0, mongoose_1.model)('StepUpVerification', stepUpVerificationSchema);
