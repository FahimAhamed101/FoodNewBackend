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
const category_model_1 = require("../models/category.model");
const providerProfile_model_1 = require("../models/providerProfile.model");
const mealToken_model_1 = require("../models/mealToken.model");
const mongoose_1 = require("mongoose");
const mediaUrl_1 = require("../utils/mediaUrl");
class FeedService {
    deriveSeed(value, fallback) {
        if (!value)
            return fallback;
        const source = value.toString().replace(/[^a-fA-F0-9]/g, '');
        if (!source)
            return fallback;
        const tail = source.slice(-6);
        const parsed = Number.parseInt(tail, 16);
        return Number.isFinite(parsed) ? parsed : fallback;
    }
    enrichDiscoveryItem(item, index) {
        var _a;
        const seed = this.deriveSeed((_a = item === null || item === void 0 ? void 0 : item.id) === null || _a === void 0 ? void 0 : _a.toString(), index + 1);
        const etaMinutes = 10 + (seed % 26); // 10 - 35 mins
        const distanceKm = Number((0.6 + (seed % 40) / 10).toFixed(1)); // 0.6 - 4.5 km
        const reviewCount = 25 + (seed % 320);
        return Object.assign(Object.assign({}, item), { etaMinutes,
            distanceKm,
            reviewCount });
    }
    normalizeFeedItemImages(item, baseUrl) {
        const foodImage = (0, mediaUrl_1.toPublicMediaUrl)(item === null || item === void 0 ? void 0 : item.image, baseUrl);
        const providerImage = (0, mediaUrl_1.toPublicMediaUrl)(item === null || item === void 0 ? void 0 : item.providerImage, baseUrl);
        const restaurantImage = (0, mediaUrl_1.toPublicMediaUrl)((item === null || item === void 0 ? void 0 : item.restaurantImage) || (item === null || item === void 0 ? void 0 : item.providerProfile) || (item === null || item === void 0 ? void 0 : item.profile), baseUrl);
        return Object.assign(Object.assign({}, item), { image: foodImage, foodImage,
            providerImage,
            restaurantImage, restaurantProfile: restaurantImage, providerProfile: restaurantImage, profile: restaurantImage });
    }
    getFeed(filters_1) {
        return __awaiter(this, arguments, void 0, function* (filters, baseUrl = '') {
            const { categoryName, category, providerId, restaurantId, page = 1, limit = 20 } = filters;
            const resolvedCategoryName = categoryName || category;
            const resolvedProviderId = providerId || restaurantId;
            const query = {
                foodStatus: { $ne: false },
                foodAvailability: { $ne: false }
            };
            // 1. Filter by Provider ID if provided
            if (resolvedProviderId) {
                if (!mongoose_1.Types.ObjectId.isValid(resolvedProviderId)) {
                    return { foods: [], total: 0, page: Number(page), limit: Number(limit) };
                }
                query.providerId = new mongoose_1.Types.ObjectId(resolvedProviderId);
            }
            // 2. Filter by Category Name if provided
            if (resolvedCategoryName) {
                const categories = yield category_model_1.Category.find({
                    categoryStatus: true,
                    categoryName: { $regex: new RegExp(`^${resolvedCategoryName}$`, 'i') }
                });
                if (categories.length > 0) {
                    query.categoryId = { $in: categories.map(c => c._id) };
                }
                else {
                    return { foods: [], total: 0, page: Number(page), limit: Number(limit) };
                }
            }
            const skip = (Number(page) - 1) * Number(limit);
            const [foods, total] = yield Promise.all([
                food_model_1.Food.find(query)
                    .populate('categoryId', 'categoryName')
                    .populate('providerId', 'fullName profilePic googlePicture')
                    .sort({ rating: -1, createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit))
                    .lean(),
                food_model_1.Food.countDocuments(query)
            ]);
            const providerIds = Array.from(new Set(foods
                .map((food) => {
                const provider = food === null || food === void 0 ? void 0 : food.providerId;
                const rawProviderId = (provider === null || provider === void 0 ? void 0 : provider._id) || provider;
                return rawProviderId ? String(rawProviderId) : '';
            })
                .filter(Boolean)))
                .filter((id) => mongoose_1.Types.ObjectId.isValid(id))
                .map((id) => new mongoose_1.Types.ObjectId(id));
            const providerProfiles = providerIds.length
                ? yield providerProfile_model_1.ProviderProfile.find({ providerId: { $in: providerIds } })
                    .select('providerId restaurantName restaurantAddress profile')
                    .lean()
                : [];
            const providerProfileMap = new Map(providerProfiles.map((profile) => [String(profile.providerId), profile]));
            const transformedFoods = foods.map((food) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                const providerObjectId = ((_a = food.providerId) === null || _a === void 0 ? void 0 : _a._id) || food.providerId;
                const providerIdString = String(providerObjectId || '');
                const providerProfile = providerProfileMap.get(providerIdString);
                const providerDisplayName = (providerProfile === null || providerProfile === void 0 ? void 0 : providerProfile.restaurantName) || ((_b = food.providerId) === null || _b === void 0 ? void 0 : _b.fullName) || 'Unknown';
                return this.normalizeFeedItemImages({
                    id: String(food._id),
                    _id: String(food._id),
                    foodId: String(food._id),
                    name: food.title,
                    title: food.title,
                    image: food.image,
                    productDescription: food.productDescription || '',
                    baseRevenue: food.baseRevenue,
                    price: food.finalPriceTag,
                    finalPriceTag: food.finalPriceTag,
                    rating: food.rating || 0,
                    category: ((_c = food.categoryId) === null || _c === void 0 ? void 0 : _c.categoryName) || 'Unknown',
                    categoryName: ((_d = food.categoryId) === null || _d === void 0 ? void 0 : _d.categoryName) || 'Unknown',
                    serviceFee: food.serviceFee || 0,
                    provider: providerDisplayName,
                    providerName: ((_e = food.providerId) === null || _e === void 0 ? void 0 : _e.fullName) || providerDisplayName,
                    providerRestaurantName: (providerProfile === null || providerProfile === void 0 ? void 0 : providerProfile.restaurantName) || '',
                    restaurantName: (providerProfile === null || providerProfile === void 0 ? void 0 : providerProfile.restaurantName) || providerDisplayName,
                    restaurantAddress: (providerProfile === null || providerProfile === void 0 ? void 0 : providerProfile.restaurantAddress) || '',
                    providerImage: ((_f = food.providerId) === null || _f === void 0 ? void 0 : _f.profilePic) ||
                        ((_g = food.providerId) === null || _g === void 0 ? void 0 : _g.googlePicture) ||
                        (providerProfile === null || providerProfile === void 0 ? void 0 : providerProfile.profile) ||
                        '',
                    restaurantImage: (providerProfile === null || providerProfile === void 0 ? void 0 : providerProfile.profile) ||
                        ((_h = food.providerId) === null || _h === void 0 ? void 0 : _h.profilePic) ||
                        ((_j = food.providerId) === null || _j === void 0 ? void 0 : _j.googlePicture) ||
                        '',
                    providerProfile: (providerProfile === null || providerProfile === void 0 ? void 0 : providerProfile.profile) || '',
                    profile: (providerProfile === null || providerProfile === void 0 ? void 0 : providerProfile.profile) || '',
                    providerID: providerIdString,
                    providerId: providerIdString,
                    inStock: !!food.foodAvailability,
                    foodStatus: !!food.foodStatus,
                    foodAvailability: !!food.foodAvailability,
                    createdAt: food.createdAt,
                }, baseUrl);
            });
            return {
                foods: transformedFoods,
                total,
                page: Number(page),
                limit: Number(limit)
            };
        });
    }
    getHomeFeed(filters_1) {
        return __awaiter(this, arguments, void 0, function* (filters, baseUrl = '') {
            const requestedLimit = Number((filters === null || filters === void 0 ? void 0 : filters.limit) || 20);
            const normalizedLimit = Number.isFinite(requestedLimit) ? Math.max(requestedLimit, 16) : 20;
            const feedResult = yield this.getFeed(Object.assign(Object.assign({}, filters), { page: Number((filters === null || filters === void 0 ? void 0 : filters.page) || 1), limit: normalizedLimit }), baseUrl);
            const categoryDocs = yield category_model_1.Category.find({ categoryStatus: true })
                .select('categoryName')
                .sort('categoryName')
                .limit(12)
                .lean();
            const categories = [
                'All',
                ...Array.from(new Set(categoryDocs
                    .map((category) => ((category === null || category === void 0 ? void 0 : category.categoryName) || '').trim())
                    .filter(Boolean))),
            ];
            const discoveryFoods = feedResult.foods.map((food, index) => this.enrichDiscoveryItem(food, index));
            const startTheDay = discoveryFoods.slice(0, 8);
            const lateNightCravingsSource = discoveryFoods.slice(8, 16);
            const lateNightCravings = lateNightCravingsSource.length > 0
                ? lateNightCravingsSource
                : discoveryFoods.slice(0, 8);
            const featured = discoveryFoods[0] || null;
            return {
                categories,
                dealOfDay: featured ? {
                    title: `35% OFF on ${featured.category || 'Best Picks'}!`,
                    subtitle: `Fresh ${featured.name} waiting for you`,
                    ctaText: 'Buy now',
                    image: featured.image,
                } : null,
                sections: {
                    startTheDay,
                    lateNightCravings,
                },
                foods: discoveryFoods,
                total: feedResult.total,
                page: feedResult.page,
                limit: feedResult.limit,
            };
        });
    }
    getDiscoveryMetadata() {
        return __awaiter(this, void 0, void 0, function* () {
            const categories = yield category_model_1.Category.find().distinct('categoryName');
            return {
                featuredCategories: categories
            };
        });
    }
    /**
     * "Free Meal Near You" feed
     * Returns same food structure as getFeed but only from providers
     * that have available meal tokens. Includes token info.
     */
    getFreeMealFeed(filters_1) {
        return __awaiter(this, arguments, void 0, function* (filters, baseUrl = '') {
            const page = Number((filters === null || filters === void 0 ? void 0 : filters.page) || 1);
            const limit = Number((filters === null || filters === void 0 ? void 0 : filters.limit) || 20);
            // Count available tokens
            const availableCount = yield mealToken_model_1.MealToken.countDocuments({
                status: mealToken_model_1.MealTokenStatus.AVAILABLE,
            });
            if (availableCount === 0) {
                return {
                    foods: [],
                    total: 0,
                    page,
                    limit,
                    availableTokenCount: 0,
                    hasFreeMeals: false,
                };
            }
            // Get all available foods (same as normal feed)
            const feedResult = yield this.getFeed(Object.assign(Object.assign({}, filters), { page, limit }), baseUrl);
            // Tag each food item with free meal info
            const taggedFoods = feedResult.foods.map((food) => (Object.assign(Object.assign({}, food), { isFreeAvailable: true, freeTokenCount: availableCount, originalPrice: food.finalPriceTag, displayPrice: 0 })));
            return {
                foods: taggedFoods,
                total: feedResult.total,
                page,
                limit,
                availableTokenCount: availableCount,
                hasFreeMeals: true,
            };
        });
    }
}
exports.default = new FeedService();
