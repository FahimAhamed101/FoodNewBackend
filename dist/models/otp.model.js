"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Otp = exports.OtpPurpose = void 0;
const mongoose_1 = require("mongoose");
var OtpPurpose;
(function (OtpPurpose) {
    OtpPurpose["EMAIL_VERIFY"] = "EMAIL_VERIFY";
    OtpPurpose["RESET_PASSWORD"] = "RESET_PASSWORD";
})(OtpPurpose || (exports.OtpPurpose = OtpPurpose = {}));
const otpSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    otp: {
        type: String,
        required: true,
    },
    purpose: {
        type: String,
        enum: Object.values(OtpPurpose),
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 },
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
exports.Otp = (0, mongoose_1.model)('Otp', otpSchema);
