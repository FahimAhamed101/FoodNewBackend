"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const adminOrder_controller_1 = __importDefault(require("../controllers/adminOrder.controller"));
const user_model_1 = require("../models/user.model");
const router = (0, express_1.Router)();
// Protect all routes
router.use(authenticate_1.authenticate);
router.use((0, requireRole_1.requireRole)([user_model_1.UserRole.ADMIN]));
/**
 * GET /admin/orders/:orderId
 * Get full order details by orderId only (no providerId needed)
 */
router.get('/:providerId/:orderId', adminOrder_controller_1.default.getOrderDetails);
/**
 * GET /admin/orders/:providerId/:orderId
 * Get full order details by providerId and orderId
 */
router.get('/:orderId', adminOrder_controller_1.default.getOrderDetails);
exports.default = router;
