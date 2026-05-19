"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegalDocument = exports.LegalDocumentStatus = void 0;
const mongoose_1 = require("mongoose");
var LegalDocumentStatus;
(function (LegalDocumentStatus) {
    LegalDocumentStatus["ACTIVE"] = "Active";
    LegalDocumentStatus["DRAFT"] = "Draft";
})(LegalDocumentStatus || (exports.LegalDocumentStatus = LegalDocumentStatus = {}));
const legalDocumentSchema = new mongoose_1.Schema({
    documentName: {
        type: String,
        required: [true, 'Document name is required'],
        trim: true,
    },
    type: {
        type: String,
        required: [true, 'Document type is required'],
        trim: true,
    },
    size: {
        type: String,
        required: [true, 'Document size is required'],
    },
    fileUrl: {
        type: String,
        required: [true, 'File URL is required'],
    },
    status: {
        type: String,
        enum: Object.values(LegalDocumentStatus),
        default: LegalDocumentStatus.DRAFT,
    },
    uploadedBy: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});
exports.LegalDocument = (0, mongoose_1.model)('LegalDocument', legalDocumentSchema);
