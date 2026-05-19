"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const legalDocument_model_1 = require("../models/legalDocument.model");
const AppError_1 = __importDefault(require("../utils/AppError"));
class AdminLegalDocumentService {
    /**
     * Get legal documents with search, pagination and filtering
     */
    getAllDocuments(queryParams) {
        return __awaiter(this, void 0, void 0, function* () {
            const { search, status, page = 1, limit = 10 } = queryParams;
            const query = {};
            // 1. Search Filter
            if (search) {
                query.documentName = { $regex: new RegExp(search, 'i') };
            }
            // 2. Status Filter
            if (status) {
                query.status = status;
            }
            const skip = (Number(page) - 1) * Number(limit);
            const [docs, total] = yield Promise.all([
                legalDocument_model_1.LegalDocument.find(query)
                    .sort({ updatedAt: -1 })
                    .skip(skip)
                    .limit(Number(limit))
                    .lean(),
                legalDocument_model_1.LegalDocument.countDocuments(query)
            ]);
            return {
                documents: docs.map(doc => ({
                    id: doc._id,
                    DocumentName: doc.documentName,
                    Type: doc.type,
                    Size: doc.size,
                    LastUpdated: doc.updatedAt,
                    Status: doc.status,
                    fileUrl: doc.fileUrl
                })),
                meta: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            };
        });
    }
    /**
     * Create a new legal document entry
     */
    createDocument(data, adminId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield legalDocument_model_1.LegalDocument.create({
                documentName: data.DocumentName || data.documentName,
                type: data.Type || data.type,
                size: data.Size || data.size || data.Siye, // Support both
                fileUrl: data.fileUrl,
                status: data.Status || legalDocument_model_1.LegalDocumentStatus.DRAFT,
                uploadedBy: adminId
            });
        });
    }
    /**
     * Update an existing legal document
     */
    updateDocument(docId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const updateObj = {};
            if (data.DocumentName)
                updateObj.documentName = data.DocumentName;
            if (data.Type)
                updateObj.type = data.Type;
            if (data.Size || data.Siye)
                updateObj.size = data.Size || data.Siye;
            if (data.Status)
                updateObj.status = data.Status;
            if (data.fileUrl)
                updateObj.fileUrl = data.fileUrl;
            const doc = yield legalDocument_model_1.LegalDocument.findByIdAndUpdate(docId, { $set: updateObj }, { new: true });
            if (!doc)
                throw new AppError_1.default('Document not found', 404);
            return doc;
        });
    }
    /**
     * Delete a legal document
     */
    deleteDocument(docId) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield legalDocument_model_1.LegalDocument.findByIdAndDelete(docId);
            if (!doc)
                throw new AppError_1.default('Document not found', 404);
            return { message: 'Document deleted successfully' };
        });
    }
}
exports.default = new AdminLegalDocumentService();
