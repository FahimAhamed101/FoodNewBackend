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
const adminLegalDocument_service_1 = __importDefault(require("../services/adminLegalDocument.service"));
class AdminLegalDocumentController {
    /**
     * Get list of all legal documents
     */
    getDocuments(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const docs = yield adminLegalDocument_service_1.default.getAllDocuments(req.query);
                res.status(200).json({
                    success: true,
                    data: docs
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Create a new legal document entry
     */
    createDocument(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || 'system';
                const doc = yield adminLegalDocument_service_1.default.createDocument(req.body, adminId);
                res.status(201).json({
                    success: true,
                    message: 'Legal document record created',
                    data: doc
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Update a legal document entry
     */
    updateDocument(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const doc = yield adminLegalDocument_service_1.default.updateDocument(req.params.id, req.body);
                res.status(200).json({
                    success: true,
                    message: 'Document updated successfully',
                    data: doc
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Delete a legal document entry
     */
    deleteDocument(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield adminLegalDocument_service_1.default.deleteDocument(req.params.id);
                res.status(200).json({
                    success: true,
                    message: 'Document deleted successfully'
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new AdminLegalDocumentController();
