"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminRestaurant_controller_1 = __importDefault(require("../controllers/adminRestaurant.controller"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router();
// Middleware: Authenticated Admin Only
router.use(authenticate_1.authenticate, (0, requireRole_1.requireRole)([user_model_1.UserRole.ADMIN]));
// Dashboard Stats & Activity
router.get('/dashboard/stats/:restaurantId', adminRestaurant_controller_1.default.getDashboardStats);
router.get('/dashboard/activity-summary/:restaurantId', adminRestaurant_controller_1.default.getActivitySummary);
// Restaurant Management
router.get('/restaurants/:restaurantId/profile', adminRestaurant_controller_1.default.getProfile);
router.get('/restaurants/:restaurantId/pickup-windows', adminRestaurant_controller_1.default.getPickupWindows);
router.get('/restaurants/:restaurantId/compliance', adminRestaurant_controller_1.default.getCompliance);
router.get('/restaurants/:restaurantId/location', adminRestaurant_controller_1.default.getLocation);
router.post('/restaurants/:restaurantId/block', adminRestaurant_controller_1.default.blockRestaurant);
router.post('/restaurants/:restaurantId/unblock', adminRestaurant_controller_1.default.unblockRestaurant);
router.post('/restaurants/:restaurantId/approve', adminRestaurant_controller_1.default.approveRestaurant);
router.post('/restaurants/:restaurantId/reject', adminRestaurant_controller_1.default.rejectRestaurant);
// Provider Orders
router.get('/providers/:providerId/orders', adminRestaurant_controller_1.default.getProviderOrderHistory);
// Provider Reviews
router.get('/providers/:providerId/reviews', adminRestaurant_controller_1.default.getProviderReviews);
// Core Restaurant Management
router.get('/restaurants', adminRestaurant_controller_1.default.getAllRestaurants);
router.get('/restaurants/:restaurantId', adminRestaurant_controller_1.default.getRestaurantDetails);
exports.default = router;
