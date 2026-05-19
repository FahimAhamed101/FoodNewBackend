"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const banner_controller_1 = __importDefault(require("../controllers/banner.controller"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const validate_1 = require("../middlewares/validate");
const user_model_1 = require("../models/user.model");
const banner_validation_1 = require("../validations/banner.validation");
const router = express_1.default.Router();
const bannerLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100, // Increased for development (change to 10 in production)
    message: {
        status: 'fail',
        message: 'Too many requests from this IP, please try again after 15 minutes'
    }
});
router.use(bannerLimiter);
// 1. PUBLIC OR SHARED ROUTES (TOKEN REQUIRED)
router.get('/active', banner_controller_1.default.getActiveBanners);
router.use(authenticate_1.authenticate);
// Allow all authenticated users (Admin, Provider, Customer) to list banners
router.get('/', (0, validate_1.validate)(banner_validation_1.getBannersQuerySchema), banner_controller_1.default.listAllBanners);
// 2. ADMIN ONLY MANAGEMENT ROUTES
router.use((0, requireRole_1.requireRole)([user_model_1.UserRole.ADMIN]));
router.post('/', (0, validate_1.validate)(banner_validation_1.createBannerSchema), banner_controller_1.default.createBanner);
router.patch('/:id', (0, validate_1.validate)(banner_validation_1.updateBannerSchema), banner_controller_1.default.updateBanner);
router.delete('/:id', banner_controller_1.default.deleteBanner);
exports.default = router;
