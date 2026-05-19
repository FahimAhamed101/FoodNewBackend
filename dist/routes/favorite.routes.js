"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const favorite_controller_1 = __importDefault(require("../controllers/favorite.controller"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const validate_1 = require("../middlewares/validate");
const favorite_validation_1 = require("../validations/favorite.validation");
const router = express_1.default.Router();
const favoriteLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many favorite requests, please try again later',
    },
});
router.use(authenticate_1.authenticate);
router.use(favoriteLimiter);
router.post('/', (0, requireRole_1.requireRole)(['CUSTOMER']), (0, validate_1.validate)(favorite_validation_1.createFavoriteSchema), favorite_controller_1.default.addFavorite);
router.get('/feed', (0, requireRole_1.requireRole)(['CUSTOMER']), (0, validate_1.validate)(favorite_validation_1.getFeedSchema), favorite_controller_1.default.getFavoriteFeed);
router.delete('/:foodId', (0, requireRole_1.requireRole)(['CUSTOMER']), (0, validate_1.validate)(favorite_validation_1.removeFavoriteSchema), favorite_controller_1.default.removeFavorite);
exports.default = router;
