"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const user_model_1 = require("../models/user.model");
const mealToken_controller_1 = __importDefault(require("../controllers/mealToken.controller"));
const router = (0, express_1.Router)();
// Protect all routes - Admin only
router.use(authenticate_1.authenticate);
router.use((0, requireRole_1.requireRole)([user_model_1.UserRole.ADMIN]));
/**
 * GET /api/v1/admin/donation/tokens
 * Query: ?status=available&page=1&limit=20
 * Admin sees all tokens with filters
 */
router.get('/tokens', mealToken_controller_1.default.adminGetAllTokens);
exports.default = router;
