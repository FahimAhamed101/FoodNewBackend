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
const favorite_service_1 = __importDefault(require("../services/favorite.service"));
const catchAsync_1 = require("../utils/catchAsync");
class FavoriteController {
    constructor() {
        /**
         * POST /favorites
         */
        this.addFavorite = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.userId;
            const { foodId } = req.body;
            const result = yield favorite_service_1.default.addFavorite(userId, foodId);
            res.status(201).json({
                success: true,
                data: result,
            });
        }));
        /**
         * DELETE /favorites/:foodId
         */
        this.removeFavorite = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.userId;
            const foodId = req.params.foodId;
            const result = yield favorite_service_1.default.removeFavorite(userId, foodId);
            res.status(200).json({
                success: true,
                data: result,
            });
        }));
        /**
         * GET /favorites/feed
         */
        this.getFavoriteFeed = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = yield favorite_service_1.default.getFavoriteFeed(userId, page, limit);
            res.status(200).json({
                success: true,
                data: result,
            });
        }));
        /**
         * GET /foods/:foodId/stats
         * Note: This might be routed from /foods route or /favorites route depending on design.
         * Implementation here for completeness.
         */
        this.getFoodStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const foodId = req.params.foodId;
            // This endpoint is for Providers, but could be public. 
            // Prompt says "Providers can: See how many users favorited a food".
            const stats = yield favorite_service_1.default.getFoodStats(foodId);
            res.status(200).json({
                success: true,
                data: stats,
            });
        }));
    }
}
exports.default = new FavoriteController();
