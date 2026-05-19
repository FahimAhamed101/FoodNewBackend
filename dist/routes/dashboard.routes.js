"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dashboard_controller_1 = __importDefault(require("../controllers/dashboard.controller"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const router = express_1.default.Router();
const dashboardLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many requests to dashboard, please try again later',
    },
});
router.use(authenticate_1.authenticate);
router.use((0, requireRole_1.requireRole)(['PROVIDER']));
router.use(dashboardLimiter);
router.get('/', dashboard_controller_1.default.getUnifiedDashboard);
router.get('/overview', dashboard_controller_1.default.getOverview);
router.get('/revenue-analytics', dashboard_controller_1.default.getRevenueAnalytics);
router.get('/popular-dishes', dashboard_controller_1.default.getPopularDishes);
router.get('/recent-orders', dashboard_controller_1.default.getRecentOrders);
exports.default = router;
