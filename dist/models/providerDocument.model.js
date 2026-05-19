"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderDocument = void 0;
const mongoose_1 = require("mongoose");
const providerDocumentSchema = new mongoose_1.Schema({
    providerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    businessLicense: { type: String, default: '' },
    EIN: { type: String, default: '' },
    healthPermit: { type: String, default: '' },
    stateOrCityLicense: { type: String, default: '' },
    proofOfAddress: { type: String, default: '' },
    ownerGovernmentID: { type: String, default: '' },
    businessBankName: { type: String, default: '' },
    businessBankAccountNumber: { type: String, default: '' },
    businessBankRoutingNumber: { type: String, default: '' },
    documentStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    rejectionReason: { type: String },
    reviewedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    adminNotes: { type: String },
    submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });
exports.ProviderDocument = (0, mongoose_1.model)('ProviderDocument', providerDocumentSchema);
