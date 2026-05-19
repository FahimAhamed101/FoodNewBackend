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
const favorite_model_1 = require("../models/favorite.model");
const food_model_1 = require("../models/food.model");
const mongoose_1 = require("mongoose");
const AppError_1 = __importDefault(require("../utils/AppError"));
class FavoriteService {
    /**
     * @description Add a food item to favorites
     * @param userId User's ID
     * @param foodId Food Item ID
     */
    addFavorite(userId, foodId) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Verify Food Exists and is Active
            const food = yield food_model_1.Food.findOne({ _id: new mongoose_1.Types.ObjectId(foodId), foodStatus: true });
            if (!food) {
                throw new AppError_1.default('Food item not found or unavailable', 404, 'FOOD_NOT_FOUND');
            }
            // 2. Create Favorite Record (Atomic handling via Unique Index)
            try {
                const favorite = yield favorite_model_1.Favorite.create({
                    userId: new mongoose_1.Types.ObjectId(userId),
                    foodId: new mongoose_1.Types.ObjectId(foodId),
                });
                // 3. Atomically increment favoriteCount in Food
                yield food_model_1.Food.updateOne({ _id: new mongoose_1.Types.ObjectId(foodId) }, { $inc: { favoriteCount: 1 } });
                return {
                    favorite,
                    alreadyFavorited: false,
                };
            }
            catch (error) {
                // Duplicate favorite is treated as idempotent success.
                if (error.code === 11000) {
                    const existing = yield favorite_model_1.Favorite.findOne({
                        userId: new mongoose_1.Types.ObjectId(userId),
                        foodId: new mongoose_1.Types.ObjectId(foodId),
                    }).lean();
                    return {
                        favorite: existing,
                        alreadyFavorited: true,
                        message: 'Food already favorited',
                    };
                }
                throw error;
            }
        });
    }
    /**
     * @description Remove a food item from favorites
     * @param userId User's ID
     * @param foodId Food Item ID
     */
    removeFavorite(userId, foodId) {
        return __awaiter(this, void 0, void 0, function* () {
            const deleted = yield favorite_model_1.Favorite.findOneAndDelete({
                userId: new mongoose_1.Types.ObjectId(userId),
                foodId: new mongoose_1.Types.ObjectId(foodId),
            });
            if (!deleted) {
                return {
                    message: 'Favorite not found',
                    removed: false,
                };
            }
            // Atomically decrement favoriteCount, ensuring it doesn't go below 0
            yield food_model_1.Food.updateOne({ _id: new mongoose_1.Types.ObjectId(foodId), favoriteCount: { $gt: 0 } }, { $inc: { favoriteCount: -1 } });
            return {
                message: 'Removed from favorites',
                removed: true,
            };
        });
    }
    /**
     * @description Get Customer's Favorite Feed
     * @param userId User's ID
     * @param page Pagination page
     * @param limit Pagination limit
     */
    getFavoriteFeed(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 10) {
            var _a;
            const skip = (page - 1) * limit;
            const pipeline = [
                // 1. Match User's Favorites
                { $match: { userId: new mongoose_1.Types.ObjectId(userId) } },
                // 2. Sort by most recently favorited
                { $sort: { createdAt: -1 } },
                // 3. Pagination early to reduce lookup load
                {
                    $facet: {
                        metadata: [{ $count: 'total' }],
                        data: [
                            { $skip: skip },
                            { $limit: limit },
                            // 4. Lookup Food Details
                            {
                                $lookup: {
                                    from: 'foods',
                                    localField: 'foodId',
                                    foreignField: '_id',
                                    as: 'food',
                                },
                            },
                            { $unwind: '$food' },
                            // 5. Filter only Active Foods (in case status changed)
                            { $match: { 'food.foodStatus': true } },
                            // 6. Project Minimal Fields
                            {
                                $project: {
                                    _id: 0,
                                    favoritedAt: '$createdAt',
                                    food: {
                                        foodId: '$food._id',
                                        title: '$food.title',
                                        image: '$food.image',
                                        finalPriceTag: '$food.finalPriceTag',
                                        favoriteCount: '$food.favoriteCount',
                                    },
                                },
                            },
                        ],
                    },
                },
            ];
            const result = yield favorite_model_1.Favorite.aggregate(pipeline);
            const favorites = result[0].data;
            const total = ((_a = result[0].metadata[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
            return {
                favorites,
                pagination: {
                    total,
                    page,
                    limit,
                },
            };
        });
    }
    /**
     * @description Get Stats for a specific food (Favorite Count & Rating)
     * @param foodId Food ID
     */
    getFoodStats(foodId) {
        return __awaiter(this, void 0, void 0, function* () {
            const stats = yield food_model_1.Food.aggregate([
                { $match: { _id: new mongoose_1.Types.ObjectId(foodId) } },
                {
                    $lookup: {
                        from: 'reviews',
                        localField: 'providerId',
                        foreignField: 'providerId',
                        as: 'reviews',
                    },
                },
                {
                    $addFields: {
                        rating: { $ifNull: [{ $avg: '$reviews.rating' }, 0] },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        favoriteCount: 1,
                        rating: { $round: ['$rating', 1] },
                    },
                },
            ]);
            if (!stats.length) {
                throw new AppError_1.default('Food not found', 404, 'FOOD_NOT_FOUND');
            }
            return stats[0];
        });
    }
}
exports.default = new FavoriteService();
