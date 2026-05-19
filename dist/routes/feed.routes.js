"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const feed_controller_1 = __importDefault(require("../controllers/feed.controller"));
const validate_1 = require("../middlewares/validate");
const feed_validation_1 = require("../validations/feed.validation");
const router = express_1.default.Router();
const feedLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many feed requests, please try again later',
    },
});
router.use(feedLimiter);
router.get('/home', (0, validate_1.validate)(feed_validation_1.getFeedSchema), feed_controller_1.default.getHomeFeed);
router.get('/free-meals', feed_controller_1.default.getFreeMealFeed);
router.get('/', (0, validate_1.validate)(feed_validation_1.getFeedSchema), feed_controller_1.default.getFeed);
exports.default = router;
