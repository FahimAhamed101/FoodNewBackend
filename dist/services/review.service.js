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
const review_model_1 = require("../models/review.model");
const order_model_1 = require("../models/order.model");
const AppError_1 = __importDefault(require("../utils/AppError"));
const mongoose_1 = require("mongoose");
class ReviewService {
    createReview(customerId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            console.log(`📝 [ReviewService] Creating review for Order: ${data.orderId}, Customer: ${customerId}`);
            const order = yield order_model_1.Order.findOne({
                $or: [
                    { orderId: data.orderId },
                    { _id: mongoose_1.Types.ObjectId.isValid(data.orderId) ? new mongoose_1.Types.ObjectId(data.orderId) : undefined }
                ].filter(q => q._id !== undefined || q.orderId)
            });
            if (!order) {
                console.error(`❌ [ReviewService] Order not found: ${data.orderId}`);
                throw new AppError_1.default('Order not found', 404, 'ORDER_NOT_FOUND');
            }
            console.log(`📦 [ReviewService] Order status: ${order.status}, Items count: ${(_a = order.items) === null || _a === void 0 ? void 0 : _a.length}`);
            if (order.status !== order_model_1.OrderStatus.COMPLETED) {
                console.warn(`⚠️ [ReviewService] Order not completed. Status: ${order.status}`);
                throw new AppError_1.default('You can only review completed orders', 400, 'ORDER_NOT_COMPLETED');
            }
            if (order.customerId.toString() !== customerId) {
                throw new AppError_1.default('You are not authorized to review this order', 403, 'FORBIDDEN');
            }
            // Auto-Link Logic: If foodId is missing but order has only one item, link it automatically
            let targetFoodId = data.foodId;
            if ((!targetFoodId || targetFoodId === "") && order.items && order.items.length === 1) {
                targetFoodId = order.items[0].foodId.toString();
                console.log(`🔗 [ReviewService] Auto-linking review to foodId: ${targetFoodId}`);
            }
            else {
                console.log(`ℹ️ [ReviewService] foodId provided or multiple items. TargetFoodId: ${targetFoodId}`);
            }
            // If foodId is provided (or auto-assigned), verify it belongs to this order
            if (targetFoodId && targetFoodId !== "") {
                const foodInOrder = order.items.find(item => item.foodId.toString() === targetFoodId);
                if (!foodInOrder) {
                    console.error(`❌ [ReviewService] FoodId ${targetFoodId} not in order`);
                    throw new AppError_1.default('Food item not found in this order', 400, 'FOOD_NOT_IN_ORDER');
                }
            }
            const review = yield review_model_1.Review.create({
                providerId: order.providerId,
                customerId: order.customerId,
                orderId: order._id,
                foodId: (targetFoodId && mongoose_1.Types.ObjectId.isValid(targetFoodId))
                    ? new mongoose_1.Types.ObjectId(targetFoodId)
                    : (order.items && order.items.length === 1 ? order.items[0].foodId : undefined),
                rating: data.rating,
                comment: data.comment,
            });
            console.log(`✅ [ReviewService] Review created: ${review._id}, foodId: ${review.foodId || 'NONE'}`);
            // Convert to plain object and ensure foodId is present (even if empty) to return as spec
            const reviewObj = review.toObject();
            return Object.assign(Object.assign({}, reviewObj), { foodId: reviewObj.foodId ? reviewObj.foodId.toString() : "" });
        });
    }
    getFoodReviews(foodId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(foodId)) {
                throw new AppError_1.default('Invalid Food ID', 400, 'INVALID_FOOD_ID');
            }
            const foodObjectId = new mongoose_1.Types.ObjectId(foodId);
            // Fetch aggregation for statistics and the reviews list in parallel
            const [stats, reviews] = yield Promise.all([
                review_model_1.Review.aggregate([
                    { $match: { foodId: foodObjectId } },
                    {
                        $group: {
                            _id: null,
                            averageRating: { $avg: '$rating' },
                            totalReviews: { $sum: 1 },
                            distribution: {
                                $push: '$rating'
                            }
                        }
                    }
                ]),
                review_model_1.Review.find({ foodId: foodObjectId })
                    .populate('customerId', 'fullName profilePic')
                    .sort({ createdAt: -1 })
            ]);
            // Process distribution
            const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            let averageRating = 0;
            let totalReviews = 0;
            if (stats.length > 0) {
                averageRating = Math.round(stats[0].averageRating * 10) / 10;
                totalReviews = stats[0].totalReviews;
                stats[0].distribution.forEach((r) => {
                    const star = r;
                    if (ratingDistribution[star] !== undefined) {
                        ratingDistribution[star]++;
                    }
                });
            }
            return {
                totalReviews,
                averageRating,
                ratingDistribution,
                reviews: reviews.map(rev => {
                    var _a, _b;
                    return ({
                        id: rev._id,
                        name: ((_a = rev.customerId) === null || _a === void 0 ? void 0 : _a.fullName) || 'Anonymous',
                        profileImage: ((_b = rev.customerId) === null || _b === void 0 ? void 0 : _b.profilePic) || '',
                        rating: rev.rating,
                        description: rev.comment,
                        date: rev.createdAt
                    });
                })
            };
        });
    }
    getReviewById(reviewId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(reviewId))
                throw new AppError_1.default('Invalid Review ID', 400, 'INVALID_ID');
            const review = yield review_model_1.Review.findById(reviewId)
                .populate('customerId', 'fullName profilePicture')
                .populate('providerId', 'fullName');
            if (!review)
                throw new AppError_1.default('Review not found', 404, 'NOT_FOUND');
            return review;
        });
    }
    updateReview(reviewId, customerId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const review = yield review_model_1.Review.findOne({ _id: reviewId, customerId: new mongoose_1.Types.ObjectId(customerId) });
            if (!review)
                throw new AppError_1.default('Review not found or not authorized', 404, 'NOT_FOUND');
            if (data.rating)
                review.rating = data.rating;
            if (data.comment)
                review.comment = data.comment;
            yield review.save();
            return review;
        });
    }
    deleteReview(reviewId, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield review_model_1.Review.findOneAndDelete({ _id: reviewId, customerId: new mongoose_1.Types.ObjectId(customerId) });
            if (!result)
                throw new AppError_1.default('Review not found or not authorized', 404, 'NOT_FOUND');
            return true;
        });
    }
    replyToReview(userId, role, reviewId, comment) {
        return __awaiter(this, void 0, void 0, function* () {
            let review;
            if (role === 'ADMIN') {
                review = yield review_model_1.Review.findById(reviewId);
            }
            else {
                review = yield review_model_1.Review.findOne({ _id: reviewId, providerId: new mongoose_1.Types.ObjectId(userId) });
            }
            if (!review)
                throw new AppError_1.default('Review not found or you are not authorized to reply', 404, 'NOT_AUTHORIZED');
            review.reply = {
                comment,
                createdAt: new Date(),
            };
            yield review.save();
            return review;
        });
    }
    getRatingDistribution(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const stats = yield review_model_1.Review.aggregate([
                { $match: { providerId: new mongoose_1.Types.ObjectId(providerId) } },
                {
                    $group: {
                        _id: '$rating',
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: -1 } },
            ]);
            const distribution = [5, 4, 3, 2, 1].map(star => {
                const found = stats.find(s => s._id === star);
                return { rating: star, count: found ? found.count : 0 };
            });
            const totalReviews = distribution.reduce((acc, curr) => acc + curr.count, 0);
            const averageRating = totalReviews > 0
                ? (distribution.reduce((acc, curr) => acc + (curr.rating * curr.count), 0) / totalReviews).toFixed(1)
                : 0;
            return { totalReviews, averageRating, distribution };
        });
    }
    searchAndFilterReviews(providerId, filters) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { rating, customerName, page = 1, limit = 10 } = filters;
            const skip = (Number(page) - 1) * Number(limit);
            const pipeline = [];
            if (providerId) {
                pipeline.push({ $match: { providerId: new mongoose_1.Types.ObjectId(providerId) } });
            }
            if (rating && rating !== 'all') {
                pipeline.push({ $match: { rating: Number(rating) } });
            }
            pipeline.push({
                $lookup: {
                    from: 'users',
                    localField: 'customerId',
                    foreignField: '_id',
                    as: 'customer',
                },
            }, { $unwind: '$customer' });
            if (customerName) {
                pipeline.push({
                    $match: {
                        'customer.fullName': { $regex: customerName, $options: 'i' }
                    }
                });
            }
            pipeline.push({ $sort: { createdAt: -1 } });
            const result = yield review_model_1.Review.aggregate([
                ...pipeline,
                {
                    $facet: {
                        metadata: [{ $count: 'total' }],
                        data: [
                            { $skip: skip },
                            { $limit: Number(limit) },
                            {
                                $project: {
                                    _id: 1,
                                    rating: 1,
                                    comment: 1,
                                    reply: 1,
                                    createdAt: 1,
                                    customerName: '$customer.fullName',
                                    customerProfile: '$customer.profilePic'
                                }
                            }
                        ],
                    },
                },
            ]);
            const total = ((_a = result[0].metadata[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
            const reviews = result[0].data;
            return {
                reviews,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit)),
                },
            };
        });
    }
    /**
     * Drops old/obsolete indexes that cause E11000 errors
     */
    cleanupObsoleteIndexes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = review_model_1.Review.collection;
                const indexes = yield collection.indexes();
                const hasGhostIndex = indexes.some(idx => idx.name === 'orderId_1_reviewerId_1');
                if (hasGhostIndex) {
                    console.log('🧹 [ReviewService] Dropping obsolete ghost index: orderId_1_reviewerId_1');
                    yield collection.dropIndex('orderId_1_reviewerId_1');
                    console.log('✅ [ReviewService] Ghost index dropped successfully.');
                }
            }
            catch (err) {
                console.error('❌ [ReviewService] Error cleaning up indexes:', err);
            }
        });
    }
}
exports.default = new ReviewService();
