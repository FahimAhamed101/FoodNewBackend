"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceViolation = exports.ViolationStatus = void 0;
const mongoose_1 = require("mongoose");
var ViolationStatus;
(function (ViolationStatus) {
    ViolationStatus["PENDING"] = "Pending";
    ViolationStatus["WARNED"] = "Warned";
    ViolationStatus["REMOVED"] = "Removed";
    ViolationStatus["RESOLVED"] = "Resolved";
})(ViolationStatus || (exports.ViolationStatus = ViolationStatus = {}));
const complianceViolationSchema = new mongoose_1.Schema({
    listingId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Food',
        required: true,
        index: true
    },
    providerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    issue: {
        type: String,
        required: true
    },
    detectedKeywords: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: Object.values(ViolationStatus),
        default: ViolationStatus.PENDING,
        index: true
    },
    severity: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    }
}, {
    timestamps: true
});
exports.ComplianceViolation = (0, mongoose_1.model)('ComplianceViolation', complianceViolationSchema);
