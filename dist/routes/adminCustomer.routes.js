"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const adminCustomer_controller_1 = __importDefault(require("../controllers/adminCustomer.controller"));
const user_model_1 = require("../models/user.model");
const router = (0, express_1.Router)();
// Protect all routes
router.use(authenticate_1.authenticate);
router.use((0, requireRole_1.requireRole)([user_model_1.UserRole.ADMIN]));
/**
 * GET /admin/customers/dashboard/customersAll
 *
 * Get detailed list of all restaurants (customers)
 */
router.get('/dashboard/customersAll', adminCustomer_controller_1.default.getAllRestaurantsDashboard);
/**
 * GET /admin/customers/dashboard/admin/:customerId/profile
 *
 * Get detailed customer profile for admin dashboard
 */
router.get('/dashboard/admin/:customerId/profile', adminCustomer_controller_1.default.getCustomerProfileDashboard);
/**
 * GET /admin/customers/dashboard/:customerId
 *
 * Get customer activity dashboard
 */
router.get('/dashboard/:customerId', adminCustomer_controller_1.default.getCustomerDashboard);
exports.default = router;
