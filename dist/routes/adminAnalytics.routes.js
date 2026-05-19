"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminAnalytics_controller_1 = __importDefault(require("../controllers/adminAnalytics.controller"));
const adminDashboard_controller_1 = __importDefault(require("../controllers/adminDashboard.controller"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const validate_1 = require("../middlewares/validate");
const adminAnalytics_validation_1 = require("../validations/adminAnalytics.validation");
const router = express_1.default.Router();
// All analytics routes require admin authentication
router.use(authenticate_1.authenticate);
router.use((0, requireRole_1.requireRole)(['ADMIN']));
router.get('/', adminDashboard_controller_1.default.getAnalytics);
router.get('/overview', (0, validate_1.validate)(adminAnalytics_validation_1.analyticsQuerySchema), adminAnalytics_controller_1.default.getOverview);
router.get('/revenue', (0, validate_1.validate)(adminAnalytics_validation_1.analyticsQuerySchema), adminAnalytics_controller_1.default.getRevenueAnalytics);
router.get('/orders', (0, validate_1.validate)(adminAnalytics_validation_1.analyticsQuerySchema), adminAnalytics_controller_1.default.getOrderAnalytics);
router.get('/recent-orders', (0, validate_1.validate)(adminAnalytics_validation_1.recentOrdersQuerySchema), adminAnalytics_controller_1.default.getRecentOrders);
router.get('/recent-reviews', adminAnalytics_controller_1.default.getRecentReviews);
router.get('/trending-menus', (0, validate_1.validate)(adminAnalytics_validation_1.analyticsQuerySchema), adminAnalytics_controller_1.default.getTrendingMenus);
router.get('/top-restaurants', (0, validate_1.validate)(adminAnalytics_validation_1.analyticsQuerySchema), adminAnalytics_controller_1.default.getTopRestaurants);
router.get('/master', (0, validate_1.validate)(adminAnalytics_validation_1.analyticsQuerySchema), adminAnalytics_controller_1.default.getMasterAnalytics);
router.get('/reports', (0, validate_1.validate)(adminAnalytics_validation_1.analyticsQuerySchema), adminAnalytics_controller_1.default.getAnalyticsReports);
exports.default = router;
