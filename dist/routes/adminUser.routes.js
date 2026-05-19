"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const user_model_1 = require("../models/user.model");
const adminUser_controller_1 = __importDefault(require("../controllers/adminUser.controller"));
const router = (0, express_1.Router)();
// Protect all routes - Admin only
router.use(authenticate_1.authenticate);
router.use((0, requireRole_1.requireRole)([user_model_1.UserRole.ADMIN]));
/**
 * GET /api/v1/admin/users/customers
 * List all users with CUSTOMER role
 */
router.get('/customers', adminUser_controller_1.default.getCustomers);
/**
 * GET /api/v1/admin/users/providers
 * List all users with PROVIDER role
 */
router.get('/providers', adminUser_controller_1.default.getProviders);
router.patch('/:userId/block', adminUser_controller_1.default.blockUser);
router.patch('/:userId/unblock', adminUser_controller_1.default.unblockUser);
exports.default = router;
