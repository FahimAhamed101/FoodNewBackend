"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const adminLegalDocument_controller_1 = __importDefault(require("../controllers/adminLegalDocument.controller"));
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router();
// All legal document administration routes require ADMIN role
router.use(authenticate_1.authenticate);
router.use((0, requireRole_1.requireRole)([user_model_1.UserRole.ADMIN]));
/**
 * @route GET /api/v1/admin/legal/documents
 * @desc Get all legal documents
 */
router.get('/documents', adminLegalDocument_controller_1.default.getDocuments);
/**
 * @route POST /api/v1/admin/legal/documents
 * @desc Add a new legal document record
 */
router.post('/documents', adminLegalDocument_controller_1.default.createDocument);
/**
 * @route PATCH /api/v1/admin/legal/documents/:id
 * @desc Update a legal document record
 */
router.patch('/documents/:id', adminLegalDocument_controller_1.default.updateDocument);
/**
 * @route DELETE /api/v1/admin/legal/documents/:id
 * @desc Remove a legal document record
 */
router.delete('/documents/:id', adminLegalDocument_controller_1.default.deleteDocument);
exports.default = router;
