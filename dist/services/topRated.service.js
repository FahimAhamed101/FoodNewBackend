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
Object.defineProperty(exports, "__esModule", { value: true });
const food_model_1 = require("../models/food.model");
const review_model_1 = require("../models/review.model");
const providerProfile_model_1 = require("../models/providerProfile.model");
const mongoose_1 = require("mongoose");
class TopRatedService {
    /**
     * Get Top Rated Restaurants (Sorted by review count and rating)
     * Shows ALL restaurants, sorted by total reviews first, then by rating
     */
    getTopRestaurants(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const { page = 1, limit = 20, minRating = 0 } = filters;
            const skip = (Number(page) - 1) * Number(limit);
            // Aggregate reviews by provider to calculate average rating
            const providerRatings = yield review_model_1.Review.aggregate([
                {
                    $group: {
                        _id: '$providerId',
                        averageRating: { $avg: '$rating' },
                        totalReviews: { $sum: 1 }
                    }
                },
                {
                    $match: {
                        averageRating: { $gte: Number(minRating) }
                    }
                },
                {
                    // Sort by total reviews first (most reviews first), then by rating
                    $sort: { totalReviews: -1, averageRating: -1 }
                }
            ]);
            // Get provider IDs
            const providerIds = providerRatings.map(p => p._id);
            // Get ALL active providers (not just those with reviews)
            const allProviderQuery = {
                isActive: true,
                status: 'ACTIVE',
                verificationStatus: 'APPROVED'
            };
            // If we have providers with reviews, prioritize them
            const [providersWithReviews, providersWithoutReviews, totalWithReviews, totalWithoutReviews] = yield Promise.all([
                // Providers with reviews
                providerProfile_model_1.ProviderProfile.find(Object.assign(Object.assign({}, allProviderQuery), { providerId: { $in: providerIds } }))
                    .populate('providerId', 'fullName email')
                    .lean(),
                // Providers without reviews
                providerProfile_model_1.ProviderProfile.find(Object.assign(Object.assign({}, allProviderQuery), { providerId: { $nin: providerIds } }))
                    .populate('providerId', 'fullName email')
                    .lean(),
                providerProfile_model_1.ProviderProfile.countDocuments(Object.assign(Object.assign({}, allProviderQuery), { providerId: { $in: providerIds } })),
                providerProfile_model_1.ProviderProfile.countDocuments(Object.assign(Object.assign({}, allProviderQuery), { providerId: { $nin: providerIds } }))
            ]);
            // Transform providers with reviews
            const transformedWithReviews = providersWithReviews.map((provider) => {
                var _a;
                const ratingData = providerRatings.find(r => { var _a, _b; return r._id.toString() === ((_b = (_a = provider.providerId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()); });
                return {
                    id: provider._id,
                    providerId: ((_a = provider.providerId) === null || _a === void 0 ? void 0 : _a._id) || provider.providerId,
                    restaurantName: provider.restaurantName,
                    profile: provider.profile,
                    cuisine: provider.cuisine || [],
                    city: provider.city,
                    state: provider.state,
                    address: provider.restaurantAddress,
                    rating: (ratingData === null || ratingData === void 0 ? void 0 : ratingData.averageRating) || 0,
                    totalReviews: (ratingData === null || ratingData === void 0 ? void 0 : ratingData.totalReviews) || 0,
                    location: provider.location,
                    isVerified: provider.isVerify,
                    contactEmail: provider.contactEmail,
                    phoneNumber: provider.phoneNumber
                };
            }).filter(r => r.providerId); // Remove any with null providerId
            // Transform providers without reviews
            const transformedWithoutReviews = providersWithoutReviews.map((provider) => {
                var _a;
                return ({
                    id: provider._id,
                    providerId: ((_a = provider.providerId) === null || _a === void 0 ? void 0 : _a._id) || provider.providerId,
                    restaurantName: provider.restaurantName,
                    profile: provider.profile,
                    cuisine: provider.cuisine || [],
                    city: provider.city,
                    state: provider.state,
                    address: provider.restaurantAddress,
                    rating: 0,
                    totalReviews: 0,
                    location: provider.location,
                    isVerified: provider.isVerify,
                    contactEmail: provider.contactEmail,
                    phoneNumber: provider.phoneNumber
                });
            }).filter(r => r.providerId); // Remove any with null providerId
            // Sort providers with reviews by total reviews (descending), then by rating
            transformedWithReviews.sort((a, b) => {
                if (b.totalReviews !== a.totalReviews) {
                    return b.totalReviews - a.totalReviews; // Most reviews first
                }
                return b.rating - a.rating; // Then highest rating
            });
            // Combine: providers with reviews first, then without reviews
            const allRestaurants = [...transformedWithReviews, ...transformedWithoutReviews];
            // Apply pagination
            const paginatedRestaurants = allRestaurants.slice(skip, skip + Number(limit));
            return {
                restaurants: paginatedRestaurants,
                total: totalWithReviews + totalWithoutReviews,
                page: Number(page),
                limit: Number(limit)
            };
        });
    }
    /**
     * Get Top Rated Foods (Rating >= 4.5)
     */
    getTopFoods(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const { page = 1, limit = 20, minRating = 4.5, providerId } = filters;
            const skip = (Number(page) - 1) * Number(limit);
            // Build match query for food reviews
            const matchQuery = {};
            if (providerId) {
                matchQuery.providerId = new mongoose_1.Types.ObjectId(providerId);
            }
            // Aggregate reviews by food to calculate average rating
            const foodRatings = yield review_model_1.Review.aggregate([
                {
                    $match: Object.assign({ foodId: { $exists: true, $ne: null } }, matchQuery)
                },
                {
                    $group: {
                        _id: '$foodId',
                        averageRating: { $avg: '$rating' },
                        totalReviews: { $sum: 1 }
                    }
                },
                {
                    $match: {
                        averageRating: { $gte: Number(minRating) }
                    }
                },
                {
                    $sort: { averageRating: -1, totalReviews: -1 }
                }
            ]);
            // Get food IDs
            const foodIds = foodRatings.map(f => f._id);
            // Build food query
            const foodQuery = {
                _id: { $in: foodIds },
                foodStatus: true
            };
            if (providerId) {
                foodQuery.providerId = new mongoose_1.Types.ObjectId(providerId);
            }
            // Get foods with pagination
            const [foods, total] = yield Promise.all([
                food_model_1.Food.find(foodQuery)
                    .populate('categoryId', 'categoryName')
                    .populate('providerId', 'fullName')
                    .skip(skip)
                    .limit(Number(limit))
                    .lean(),
                food_model_1.Food.countDocuments(foodQuery)
            ]);
            // Transform data
            const transformedFoods = foods.map((food) => {
                var _a, _b, _c;
                const ratingData = foodRatings.find(r => r._id.toString() === food._id.toString());
                return {
                    id: food._id,
                    name: food.title,
                    image: food.image,
                    productDescription: food.productDescription || '',
                    price: food.finalPriceTag,
                    rating: (ratingData === null || ratingData === void 0 ? void 0 : ratingData.averageRating) || 0,
                    totalReviews: (ratingData === null || ratingData === void 0 ? void 0 : ratingData.totalReviews) || 0,
                    category: ((_a = food.categoryId) === null || _a === void 0 ? void 0 : _a.categoryName) || 'Unknown',
                    provider: ((_b = food.providerId) === null || _b === void 0 ? void 0 : _b.fullName) || 'Unknown',
                    providerID: ((_c = food.providerId) === null || _c === void 0 ? void 0 : _c._id) || food.providerId,
                    inStock: food.foodAvailability
                };
            });
            // Sort by rating
            transformedFoods.sort((a, b) => b.rating - a.rating);
            return {
                foods: transformedFoods,
                total,
                page: Number(page),
                limit: Number(limit)
            };
        });
    }
}
exports.default = new TopRatedService();
