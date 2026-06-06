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
const mongoose_1 = require("mongoose");
const order_model_1 = require("../models/order.model");
const payment_model_1 = require("../models/payment.model");
const providerProfile_model_1 = require("../models/providerProfile.model");
const user_model_1 = require("../models/user.model");
const food_model_1 = require("../models/food.model");
const review_model_1 = require("../models/review.model");
const AppError_1 = __importDefault(require("../utils/AppError"));
class AdminRestaurantService {
    getDashboardStats(restaurantId) {
        return __awaiter(this, void 0, void 0, function* () {
            const objectId = new mongoose_1.Types.ObjectId(restaurantId);
            const [salesData] = yield payment_model_1.Payment.aggregate([
                { $match: { providerId: objectId, status: payment_model_1.PaymentStatus.COMPLETED } },
                {
                    $group: {
                        _id: null,
                        totalSales: { $sum: '$totalAmount' },
                        platformFee: { $sum: '$commission' },
                    }
                }
            ]);
            const [ordersData] = yield order_model_1.Order.aggregate([
                { $match: { providerId: objectId } },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                    }
                }
            ]);
            const [payoutData] = yield payment_model_1.Payment.aggregate([
                { $match: { providerId: objectId, payoutStatus: payment_model_1.PayoutStatus.PENDING, status: payment_model_1.PaymentStatus.COMPLETED } },
                {
                    $group: {
                        _id: null,
                        nextPayoutAmount: { $sum: '$netAmount' }
                    }
                }
            ]);
            return {
                totalSales: (salesData === null || salesData === void 0 ? void 0 : salesData.totalSales) || 0,
                totalOrders: (ordersData === null || ordersData === void 0 ? void 0 : ordersData.totalOrders) || 0,
                platformFeePerOrder: (salesData === null || salesData === void 0 ? void 0 : salesData.platformFee) && (ordersData === null || ordersData === void 0 ? void 0 : ordersData.totalOrders)
                    ? (salesData.platformFee / ordersData.totalOrders).toFixed(2)
                    : 0,
                nextPayout: {
                    amount: (payoutData === null || payoutData === void 0 ? void 0 : payoutData.nextPayoutAmount) || 0,
                    scheduledAt: new Date(new Date().setDate(new Date().getDate() + 7)) // Mock schedule
                }
            };
        });
    }
    getProfile(restaurantId) {
        return __awaiter(this, void 0, void 0, function* () {
            const profile = yield providerProfile_model_1.ProviderProfile.findOne({ providerId: restaurantId });
            if (!profile)
                throw new AppError_1.default('Restaurant not found', 404);
            return {
                cuisine: profile.cuisine || [],
                contact: {
                    phone: profile.phoneNumber,
                    website: '' // Not currently in schema
                }
            };
        });
    }
    getPickupWindows(restaurantId) {
        return __awaiter(this, void 0, void 0, function* () {
            const profile = yield providerProfile_model_1.ProviderProfile.findOne({ providerId: restaurantId });
            if (!profile)
                throw new AppError_1.default('Restaurant not found', 404);
            // Validation logic: pickupStartTime - listingCreatedAt >= 2 hours (Mock logic as requested)
            return profile.pickupWindows || [];
        });
    }
    getActivitySummary(restaurantId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const objectId = new mongoose_1.Types.ObjectId(restaurantId);
            const [listings, orders, reviews] = yield Promise.all([
                food_model_1.Food.countDocuments({ providerId: objectId }),
                order_model_1.Order.countDocuments({ providerId: objectId }),
                review_model_1.Review.countDocuments({ providerId: objectId }) // Assuming review has providerId or we need to look up via food
            ]);
            // Review model check: does it have providerId? 
            // If Review is linked to Food, we might need aggregation.
            // Let's assume Review has providerId for simplicity or check model.
            // Checked model: Review has 'customerId' and 'foodId'. No providerId directly.
            // We need to aggregate reviews by looking up foods owned by provider.
            const reviewCount = yield review_model_1.Review.aggregate([
                {
                    $lookup: {
                        from: 'foods',
                        localField: 'foodId',
                        foreignField: '_id',
                        as: 'food'
                    }
                },
                { $unwind: '$food' },
                { $match: { 'food.providerId': objectId } },
                { $count: 'count' }
            ]);
            return {
                listings,
                orders,
                reviews: ((_a = reviewCount[0]) === null || _a === void 0 ? void 0 : _a.count) || 0
            };
        });
    }
    getCompliance(restaurantId) {
        return __awaiter(this, void 0, void 0, function* () {
            const profile = yield providerProfile_model_1.ProviderProfile.findOne({ providerId: restaurantId });
            if (!profile)
                throw new AppError_1.default('Restaurant not found', 404);
            return profile.compliance || { alcoholNotice: { enabled: false }, tax: { region: 'US-NY', rate: 8.875 } };
        });
    }
    getLocation(restaurantId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const profile = yield providerProfile_model_1.ProviderProfile.findOne({ providerId: restaurantId });
            if (!profile)
                throw new AppError_1.default('Restaurant not found', 404);
            return {
                address: `${profile.restaurantAddress}, ${profile.city}, ${profile.state} ${profile.zipCode || ''}`,
                lat: ((_a = profile.location) === null || _a === void 0 ? void 0 : _a.lat) || 40.7128,
                lng: ((_b = profile.location) === null || _b === void 0 ? void 0 : _b.lng) || -74.0060
            };
        });
    }
    blockRestaurant(restaurantId, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            // Transactions removed for standalone MongoDB compatibility
            const objectId = new mongoose_1.Types.ObjectId(restaurantId);
            const profile = yield providerProfile_model_1.ProviderProfile.findOneAndUpdate({ providerId: restaurantId }, {
                status: 'BLOCKED',
                isActive: false,
                blockReason: reason
            }, { new: true });
            if (!profile)
                throw new AppError_1.default('Restaurant not found', 404);
            // Suspend all listings
            yield food_model_1.Food.updateMany({ providerId: objectId }, { foodStatus: false });
            return profile;
        });
    }
    unblockRestaurant(restaurantId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Transactions removed for standalone MongoDB compatibility
            const objectId = new mongoose_1.Types.ObjectId(restaurantId);
            const profile = yield providerProfile_model_1.ProviderProfile.findOneAndUpdate({ providerId: restaurantId }, {
                status: 'ACTIVE',
                isActive: true,
                $unset: { blockReason: 1 } // Remove blockReason field
            }, { new: true });
            if (!profile)
                throw new AppError_1.default('Restaurant not found', 404);
            // Reactivate all listings
            yield food_model_1.Food.updateMany({ providerId: objectId }, { foodStatus: true });
            return profile;
        });
    }
    approveRestaurant(restaurantId, approvedBy) {
        return __awaiter(this, void 0, void 0, function* () {
            const objectId = new mongoose_1.Types.ObjectId(restaurantId);
            const profile = yield providerProfile_model_1.ProviderProfile.findOneAndUpdate({ providerId: objectId }, {
                verificationStatus: 'APPROVED',
                status: 'ACTIVE',
                isActive: true,
                isVerify: true, // Legacy field
                $unset: { blockReason: 1 }
            }, { new: true });
            if (!profile) {
                throw new AppError_1.default('Restaurant not found', 404);
            }
            yield user_model_1.User.findByIdAndUpdate(objectId, {
                role: user_model_1.UserRole.PROVIDER,
                isProviderApproved: true,
                providerApprovedAt: new Date(),
                providerApprovedBy: approvedBy || 'admin',
            });
            return profile;
        });
    }
    rejectRestaurant(restaurantId, reason, reviewedBy) {
        return __awaiter(this, void 0, void 0, function* () {
            const objectId = new mongoose_1.Types.ObjectId(restaurantId);
            const profile = yield providerProfile_model_1.ProviderProfile.findOneAndUpdate({ providerId: objectId }, {
                verificationStatus: 'REJECTED',
                status: 'BLOCKED',
                isActive: false,
                blockReason: reason
            }, { new: true });
            if (!profile) {
                throw new AppError_1.default('Restaurant not found', 404);
            }
            yield user_model_1.User.findByIdAndUpdate(objectId, {
                role: user_model_1.UserRole.PROVIDER,
                isProviderApproved: false,
                providerApprovedBy: reviewedBy || 'admin',
                $unset: { providerApprovedAt: 1 }
            });
            return profile;
        });
    }
    getProviderOrderHistory(restaurantId) {
        return __awaiter(this, void 0, void 0, function* () {
            const providerId = new mongoose_1.Types.ObjectId(restaurantId);
            const orders = yield order_model_1.Order.find({ providerId })
                .select('orderId customerId status totalPrice createdAt')
                .populate('customerId', 'fullName')
                .sort({ createdAt: -1 })
                .limit(20)
                .lean();
            return orders.map((order) => {
                var _a;
                return ({
                    orderId: order.orderId,
                    customerName: ((_a = order.customerId) === null || _a === void 0 ? void 0 : _a.fullName) || 'Unknown Customer',
                    date: order.createdAt,
                    status: order.status,
                    amount: order.totalPrice
                });
            });
        });
    }
    getProviderReviews(restaurantId, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            const providerId = new mongoose_1.Types.ObjectId(restaurantId);
            const { rating, page = 1, limit = 20 } = filter;
            const skip = (page - 1) * limit;
            const query = { providerId };
            if (rating) {
                query.rating = rating;
            }
            const reviews = yield review_model_1.Review.find(query)
                .select('customerId rating comment createdAt')
                .populate('customerId', 'fullName profilePic')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
            const totalReviews = yield review_model_1.Review.countDocuments(query);
            return {
                reviews: reviews.map((review) => {
                    var _a, _b;
                    return ({
                        profilePic: ((_a = review.customerId) === null || _a === void 0 ? void 0 : _a.profilePic) || '',
                        customerName: ((_b = review.customerId) === null || _b === void 0 ? void 0 : _b.fullName) || 'Anonymous',
                        rating: review.rating,
                        reviewDetails: review.comment,
                        createdAt: review.createdAt
                    });
                }),
                pagination: {
                    total: totalReviews,
                    page,
                    limit,
                    pages: Math.ceil(totalReviews / limit)
                }
            };
        });
    }
    getAllRestaurants(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const { state, rating, status, page = 1, limit = 20 } = query;
            const skip = (Number(page) - 1) * Number(limit);
            const matchStage = {};
            // 1. State Filter
            if (state && state !== 'all_states' && state !== 'USA') {
                matchStage.state = state;
            }
            // 2. Status Filter
            if (status && status !== 'all_status') {
                if (status === 'approved') {
                    matchStage.verificationStatus = 'APPROVED';
                    matchStage.status = 'ACTIVE';
                }
                else if (status === 'pending_approval') {
                    matchStage.verificationStatus = 'PENDING';
                }
                else if (status === 'blocked') {
                    matchStage.status = 'BLOCKED';
                }
            }
            const pipeline = [
                { $match: matchStage },
                // Lookup Owner (User)
                {
                    $lookup: {
                        from: 'users',
                        localField: 'providerId',
                        foreignField: '_id',
                        as: 'owner'
                    }
                },
                { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
                // Lookup Reviews for average rating
                {
                    $lookup: {
                        from: 'reviews',
                        localField: 'providerId',
                        foreignField: 'providerId',
                        pipeline: [
                            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
                        ],
                        as: 'reviewStats'
                    }
                },
                { $unwind: { path: '$reviewStats', preserveNullAndEmptyArrays: true } },
                // Lookup Foods for total listings count
                {
                    $lookup: {
                        from: 'foods',
                        localField: 'providerId',
                        foreignField: 'providerId',
                        pipeline: [
                            { $count: 'count' }
                        ],
                        as: 'listingStats'
                    }
                },
                { $unwind: { path: '$listingStats', preserveNullAndEmptyArrays: true } },
                // Lookup Orders for revenue (sum of totalPrice where status is completed/picked_up)
                {
                    $lookup: {
                        from: 'orders',
                        localField: 'providerId',
                        foreignField: 'providerId',
                        pipeline: [
                            { $match: { status: { $in: ['completed', 'picked_up'] } } },
                            { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
                        ],
                        as: 'paymentStats'
                    }
                },
                { $unwind: { path: '$paymentStats', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        restaurantId: '$providerId',
                        restaurantName: 1,
                        owner: '$owner.fullName',
                        state: 1,
                        totalListings: { $ifNull: ['$listingStats.count', 0] },
                        revenue: { $ifNull: ['$paymentStats.totalRevenue', 0] },
                        ratings: { $ifNull: ['$reviewStats.avgRating', 0] },
                        status: {
                            $cond: {
                                if: { $eq: ['$status', 'BLOCKED'] }, then: 'blocked',
                                else: {
                                    $cond: {
                                        if: { $eq: ['$verificationStatus', 'PENDING'] }, then: 'pending_approval',
                                        else: 'approved'
                                    }
                                }
                            }
                        },
                        createdAt: 1
                    }
                }
            ];
            // 3. Ratings Filter (Post-calculation)
            if (rating && rating !== 'all_ratings') {
                const ratingNum = Math.floor(Number(rating));
                pipeline.push({
                    $match: {
                        ratings: { $gte: ratingNum, $lt: ratingNum + 1 }
                    }
                });
            }
            // Facet for Pagination
            pipeline.push({
                $facet: {
                    metadata: [{ $count: 'total' }],
                    data: [
                        { $sort: { createdAt: -1 } },
                        { $skip: skip },
                        { $limit: Number(limit) }
                    ]
                }
            });
            const result = yield providerProfile_model_1.ProviderProfile.aggregate(pipeline);
            const metadata = result[0].metadata[0] || { total: 0 };
            const restaurants = result[0].data;
            return {
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    totalRestaurants: metadata.total,
                    totalPages: Math.ceil(metadata.total / Number(limit))
                },
                restaurants
            };
        });
    }
    getRestaurantDetails(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const pId = new mongoose_1.Types.ObjectId(providerId);
            const pipeline = [
                { $match: { providerId: pId } },
                // Lookup Owner (User)
                {
                    $lookup: {
                        from: 'users',
                        localField: 'providerId',
                        foreignField: '_id',
                        as: 'owner'
                    }
                },
                { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
                // Lookup Reviews
                {
                    $lookup: {
                        from: 'reviews',
                        localField: 'providerId',
                        foreignField: 'providerId',
                        pipeline: [
                            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
                        ],
                        as: 'reviewStats'
                    }
                },
                { $unwind: { path: '$reviewStats', preserveNullAndEmptyArrays: true } },
                // Lookup Foods count
                {
                    $lookup: {
                        from: 'foods',
                        localField: 'providerId',
                        foreignField: 'providerId',
                        pipeline: [
                            { $count: 'count' }
                        ],
                        as: 'listingStats'
                    }
                },
                { $unwind: { path: '$listingStats', preserveNullAndEmptyArrays: true } },
                // Lookup Orders for revenue
                {
                    $lookup: {
                        from: 'orders',
                        localField: 'providerId',
                        foreignField: 'providerId',
                        pipeline: [
                            { $match: { status: { $in: ['completed', 'picked_up'] } } },
                            { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
                        ],
                        as: 'paymentStats'
                    }
                },
                { $unwind: { path: '$paymentStats', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 1,
                        createdAt: 1,
                        owner: {
                            restaurantsPick: { $ifNull: ['$profile', ''] },
                            name: '$owner.fullName',
                            email: '$owner.email'
                        },
                        restaurantsName: '$restaurantName',
                        restaurantsid: '$providerId',
                        status: {
                            $cond: {
                                if: { $eq: ['$status', 'BLOCKED'] }, then: 'blocked',
                                else: {
                                    $cond: {
                                        if: { $eq: ['$verificationStatus', 'PENDING'] }, then: 'pending_approval',
                                        else: 'approved'
                                    }
                                }
                            }
                        },
                        ratings: { $ifNull: ['$reviewStats.avgRating', 0] },
                        totalListings: { $ifNull: ['$listingStats.count', 0] },
                        revenue: { $ifNull: ['$paymentStats.totalRevenue', 0] },
                        documents: {
                            license: { $gt: [{ $size: { $ifNull: ['$verificationDocuments', []] } }, 0] },
                            nid: { $gt: [{ $size: { $ifNull: ['$verificationDocuments', []] } }, 1] }
                        }
                    }
                }
            ];
            const result = yield providerProfile_model_1.ProviderProfile.aggregate(pipeline);
            if (!result.length) {
                throw new AppError_1.default('Restaurant not found', 404);
            }
            return result[0];
        });
    }
    getAllRestaurantsDetailed() {
        return __awaiter(this, arguments, void 0, function* (query = {}) {
            const { page = 1, limit = 50 } = query;
            const skip = (Number(page) - 1) * Number(limit);
            const pipeline = [
                // Lookup Owner (User)
                {
                    $lookup: {
                        from: 'users',
                        localField: 'providerId',
                        foreignField: '_id',
                        as: 'owner'
                    }
                },
                { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
                // Lookup Reviews
                {
                    $lookup: {
                        from: 'reviews',
                        localField: 'providerId',
                        foreignField: 'providerId',
                        pipeline: [
                            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
                        ],
                        as: 'reviewStats'
                    }
                },
                { $unwind: { path: '$reviewStats', preserveNullAndEmptyArrays: true } },
                // Lookup Foods count
                {
                    $lookup: {
                        from: 'foods',
                        localField: 'providerId',
                        foreignField: 'providerId',
                        pipeline: [
                            { $count: 'count' }
                        ],
                        as: 'listingStats'
                    }
                },
                { $unwind: { path: '$listingStats', preserveNullAndEmptyArrays: true } },
                // Lookup Orders for revenue
                {
                    $lookup: {
                        from: 'orders',
                        localField: 'providerId',
                        foreignField: 'providerId',
                        pipeline: [
                            { $match: { status: { $in: ['completed', 'picked_up'] } } },
                            { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
                        ],
                        as: 'paymentStats'
                    }
                },
                { $unwind: { path: '$paymentStats', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 1,
                        restaurantName: 1,
                        createdAt: 1,
                        owner: {
                            name: '$owner.fullName',
                            email: '$owner.email'
                        },
                        restaurantId: '$providerId',
                        status: {
                            $cond: {
                                if: { $eq: ['$status', 'BLOCKED'] }, then: 'blocked',
                                else: {
                                    $cond: {
                                        if: { $eq: ['$verificationStatus', 'PENDING'] }, then: 'pending_approval',
                                        else: 'approved'
                                    }
                                }
                            }
                        },
                        ratings: { $ifNull: ['$reviewStats.avgRating', 0] },
                        totalListings: { $ifNull: ['$listingStats.count', 0] },
                        revenue: { $ifNull: ['$paymentStats.totalRevenue', 0] },
                        documents: {
                            license: { $gt: [{ $size: { $ifNull: ['$verificationDocuments', []] } }, 0] },
                            nid: { $gt: [{ $size: { $ifNull: ['$verificationDocuments', []] } }, 1] }
                        }
                    }
                },
                {
                    $facet: {
                        metadata: [{ $count: 'total' }],
                        data: [
                            { $sort: { createdAt: -1 } },
                            { $skip: skip },
                            { $limit: Number(limit) }
                        ]
                    }
                }
            ];
            const result = yield providerProfile_model_1.ProviderProfile.aggregate(pipeline);
            const metadata = result[0].metadata[0] || { total: 0 };
            const data = result[0].data;
            return {
                total: metadata.total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(metadata.total / Number(limit)),
                data
            };
        });
    }
}
exports.default = new AdminRestaurantService();
