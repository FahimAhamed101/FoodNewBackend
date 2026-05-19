"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const provider_controller_1 = __importDefault(require("../controllers/provider.controller"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const requireApproval_1 = require("../middlewares/requireApproval");
const validate_1 = require("../middlewares/validate");
const providerProfile_controller_1 = __importDefault(require("../controllers/providerProfile.controller"));
const providerProfile_validation_1 = require("../validations/providerProfile.validation");
const provider_validation_1 = require("../validations/provider.validation");
const upload_1 = require("../middlewares/upload");
const router = express_1.default.Router();
const providerLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many requests, please try again later',
    },
});
// Public route - no authentication required for searching nearby providers
router.post('/nearby', (0, validate_1.validate)(provider_validation_1.nearbyProvidersSchema), provider_controller_1.default.getNearbyProviders);
router.post('/donated-foods/nearby', (0, validate_1.validate)(provider_validation_1.nearbyDonatedFoodsSchema), provider_controller_1.default.getNearbyDonatedFoods);
router.get('/donated-foods/nearby', (0, validate_1.validate)(provider_validation_1.nearbyProvidersQuerySchema), provider_controller_1.default.getNearbyDonatedFoods);
// Protected routes - require authentication
router.use(authenticate_1.authenticate);
router.use((0, requireRole_1.requireRole)(['PROVIDER']));
router.use(providerLimiter);
// Routes that don't require approval (Profile management)
router.get(['/profile', '/profile/me'], providerProfile_controller_1.default.getProfile);
router.post(['/profile', '/profile/me'], upload_1.upload.single('profile'), (0, validate_1.validate)(providerProfile_validation_1.updateProfileSchema), providerProfile_controller_1.default.updateProfile);
router.patch(['/profile', '/profile/me'], upload_1.upload.single('profile'), (0, validate_1.validate)(providerProfile_validation_1.updateProfileSchema), providerProfile_controller_1.default.updateProfile);
router.put(['/profile', '/profile/me'], upload_1.upload.single('profile'), (0, validate_1.validate)(providerProfile_validation_1.updateProfileSchema), providerProfile_controller_1.default.updateProfile);
router.delete(['/profile', '/profile/me'], providerProfile_controller_1.default.deleteProfile);
// Routes that REQUIRE admin approval
router.use(requireApproval_1.requireApproval);
router.get('/orders', provider_controller_1.default.getOrders);
router.get('/orders/ready', provider_controller_1.default.getReadyOrders);
router.get('/customers/:customerId/details', provider_controller_1.default.getCustomerDetails);
exports.default = router;
