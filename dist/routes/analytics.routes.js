"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = __importDefault(require("../controllers/analytics.controller"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
const analyticsLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        status: 429,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many analytics requests, please try again after 15 minutes.'
    }
});
router.get('/insights', authenticate_1.authenticate, (0, requireRole_1.requireRole)(['PROVIDER']), analyticsLimiter, analytics_controller_1.default.getInsights);
router.get('/overview', authenticate_1.authenticate, (0, requireRole_1.requireRole)(['PROVIDER']), analyticsLimiter, analytics_controller_1.default.getOverview);
router.get('/revenue', authenticate_1.authenticate, (0, requireRole_1.requireRole)(['PROVIDER']), analyticsLimiter, analytics_controller_1.default.getRevenue);
router.get('/orders', authenticate_1.authenticate, (0, requireRole_1.requireRole)(['PROVIDER']), analyticsLimiter, analytics_controller_1.default.getOrders);
router.get('/users/distribution', authenticate_1.authenticate, (0, requireRole_1.requireRole)(['PROVIDER']), analyticsLimiter, analytics_controller_1.default.getUserDistribution);
router.get('/category-mix', authenticate_1.authenticate, (0, requireRole_1.requireRole)(['PROVIDER']), analyticsLimiter, analytics_controller_1.default.getCategoryMix);
router.get('/hourly-activity', authenticate_1.authenticate, (0, requireRole_1.requireRole)(['PROVIDER']), analyticsLimiter, analytics_controller_1.default.getHourlyActivity);
exports.default = router;
