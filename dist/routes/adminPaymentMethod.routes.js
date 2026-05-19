"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const user_model_1 = require("../models/user.model");
const adminPaymentMethod_controller_1 = __importDefault(require("../controllers/adminPaymentMethod.controller"));
const router = (0, express_1.Router)();
// Secure all routes: Admin ONLY
router.use(authenticate_1.authenticate);
router.use((0, requireRole_1.requireRole)([user_model_1.UserRole.ADMIN]));
/**
 * Platform-wide Payment Method Management
 */
router.get('/', adminPaymentMethod_controller_1.default.getAll); // List all methods
router.post('/', adminPaymentMethod_controller_1.default.create); // Create for a user
router.patch('/:id', adminPaymentMethod_controller_1.default.update); // Update details
router.delete('/:id', adminPaymentMethod_controller_1.default.delete); // Remove record
exports.default = router;
