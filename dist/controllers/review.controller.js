"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const review_service_1 = __importDefault(require("../services/review.service"));
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = __importDefault(require("../utils/AppError"));
class ReviewController {
    constructor() {
        this.createReview = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const customerId = req.user.userId;
            const review = yield review_service_1.default.createReview(customerId, req.body);
            res.status(201).json({ success: true, message: 'Review submitted', data: review });
        }));
        this.getReviewById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { reviewId } = req.params;
            const review = yield review_service_1.default.getReviewById(reviewId);
            res.status(200).json({ success: true, data: review });
        }));
        this.updateReview = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { reviewId } = req.params;
            const customerId = req.user.userId;
            const review = yield review_service_1.default.updateReview(reviewId, customerId, req.body);
            res.status(200).json({ success: true, message: 'Review updated', data: review });
        }));
        this.deleteReview = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { reviewId } = req.params;
            const customerId = req.user.userId;
            yield review_service_1.default.deleteReview(reviewId, customerId);
            res.status(200).json({ success: true, message: 'Review deleted' });
        }));
        this.replyToReview = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.userId;
            const role = req.user.role;
            const { reviewId } = req.params;
            const { comment } = req.body;
            const review = yield review_service_1.default.replyToReview(userId, role, reviewId, comment);
            res.status(200).json({ success: true, message: 'Reply added', data: review });
        }));
        this.getRatingStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const providerId = req.params.providerId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId);
            if (!providerId) {
                throw new AppError_1.default('Provider ID is required', 400, 'PROVIDER_ID_REQUIRED');
            }
            const stats = yield review_service_1.default.getRatingDistribution(providerId);
            res.status(200).json({ success: true, data: stats });
        }));
        this.getProviderReviews = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const providerId = req.params.providerId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId);
            if (!providerId) {
                throw new AppError_1.default('Provider ID is required', 400, 'PROVIDER_ID_REQUIRED');
            }
            const data = yield review_service_1.default.searchAndFilterReviews(providerId, req.query);
            res.status(200).json({ success: true, data: data.reviews, pagination: data.pagination });
        }));
        this.getFoodReviews = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { foodId } = req.params;
            const result = yield review_service_1.default.getFoodReviews(foodId);
            res.status(200).json({
                success: true,
                totalReviews: result.totalReviews,
                data: result.reviews
            });
        }));
        this.getAllReviews = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const data = yield review_service_1.default.searchAndFilterReviews(null, req.query);
            res.status(200).json({ success: true, data: data.reviews, pagination: data.pagination });
        }));
    }
}
exports.default = new ReviewController();
