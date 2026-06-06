"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const review_controller_1 = __importDefault(require("../controllers/review.controller"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const validate_1 = require("../middlewares/validate");
const review_validation_1 = require("../validations/review.validation");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router();
router.get('/provider', authenticate_1.authenticate, (0, requireRole_1.requireRole)(['PROVIDER']), (0, validate_1.validate)(review_validation_1.getReviewsQuerySchema), review_controller_1.default.getProviderReviews);
router.get('/provider/:providerId', (0, validate_1.validate)(review_validation_1.getReviewsQuerySchema), review_controller_1.default.getProviderReviews);
router.get('/stats', authenticate_1.authenticate, (0, requireRole_1.requireRole)(['PROVIDER']), review_controller_1.default.getRatingStats);
router.get('/stats/:providerId', review_controller_1.default.getRatingStats);
router.get('/all', authenticate_1.authenticate, (0, requireRole_1.requireRole)(['ADMIN']), (0, validate_1.validate)(review_validation_1.getReviewsQuerySchema), review_controller_1.default.getAllReviews);
router.get('/', authenticate_1.authenticate, (0, requireRole_1.requireRole)(['ADMIN']), (0, validate_1.validate)(review_validation_1.getReviewsQuerySchema), review_controller_1.default.getAllReviews); // alias: /api/v1/admin/reviews?page=1&limit=5
router.get('/food/:foodId', review_controller_1.default.getFoodReviews);
router.use(authenticate_1.authenticate);
router.get('/:reviewId', review_controller_1.default.getReviewById);
router.post('/', (0, requireRole_1.requireRole)(['CUSTOMER']), (0, validate_1.validate)(review_validation_1.createReviewSchema), review_controller_1.default.createReview);
router.patch('/:reviewId', (0, requireRole_1.requireRole)(['CUSTOMER']), (0, validate_1.validate)(review_validation_1.updateReviewSchema), review_controller_1.default.updateReview);
router.delete('/:reviewId', (0, requireRole_1.requireRole)(['CUSTOMER', 'ADMIN']), review_controller_1.default.deleteReview);
router.post('/:reviewId/reply', (0, requireRole_1.requireRole)([user_model_1.UserRole.PROVIDER, user_model_1.UserRole.ADMIN]), (0, validate_1.validate)(review_validation_1.replyReviewSchema), review_controller_1.default.replyToReview);
exports.default = router;
