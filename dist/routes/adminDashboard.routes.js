"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const user_model_1 = require("../models/user.model");
const adminDashboard_controller_1 = __importDefault(require("../controllers/adminDashboard.controller"));
const review_controller_1 = __importDefault(require("../controllers/review.controller"));
const adminAnalytics_controller_1 = __importDefault(require("../controllers/adminAnalytics.controller"));
const router = (0, express_1.Router)();
// Secure all routes with JWT and Admin Role
router.use(authenticate_1.authenticate);
router.use((0, requireRole_1.requireRole)([user_model_1.UserRole.ADMIN]));
router.get('/analytics', adminDashboard_controller_1.default.getAnalytics);
router.get('/feedback', adminDashboard_controller_1.default.getFeedback);
router.get('/top-restaurants', adminDashboard_controller_1.default.getTopRestaurants);
/**
 * 4️⃣ API 4: Dashboard Detailed Stats (for charts)
 * GET /api/admin/detailed-stats?timeRange=today|week|month|year
 */
router.get('/detailed-stats', adminDashboard_controller_1.default.getDetailedStats);
/**
 * 5️⃣ API 5: All Reviews (Platform-wide)
 * GET /api/v1/admin/reviews
 */
router.get('/reviews', review_controller_1.default.getAllReviews);
/**
 * 6️⃣ API 6: Trending Menu Items
 * GET /api/v1/admin/dashboard/trending-menu
 * Alias for /api/v1/admin/analytics/trending-menus
 */
router.get('/trending-menu', adminAnalytics_controller_1.default.getTrendingMenus);
exports.default = router;
