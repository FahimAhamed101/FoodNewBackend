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
const catchAsync_1 = require("../utils/catchAsync");
const feed_service_1 = __importDefault(require("../services/feed.service"));
const mediaUrl_1 = require("../utils/mediaUrl");
class FeedController {
    constructor() {
        this.getFeed = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield feed_service_1.default.getFeed(req.query, (0, mediaUrl_1.getRequestBaseUrl)(req));
            res.status(200).json({
                success: true,
                meta: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit
                },
                data: result.foods
            });
        }));
        this.getHomeFeed = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield feed_service_1.default.getHomeFeed(req.query, (0, mediaUrl_1.getRequestBaseUrl)(req));
            res.status(200).json({
                success: true,
                meta: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit
                },
                data: {
                    categories: result.categories,
                    dealOfDay: result.dealOfDay,
                    sections: result.sections,
                    foods: result.foods,
                }
            });
        }));
        /**
         * GET /api/v1/feed/free-meals
         * "Free Meal Near You" tab — same structure as normal feed
         * but tagged with free meal availability
         */
        this.getFreeMealFeed = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield feed_service_1.default.getFreeMealFeed(req.query, (0, mediaUrl_1.getRequestBaseUrl)(req));
            res.status(200).json({
                success: true,
                meta: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    availableTokenCount: result.availableTokenCount,
                    hasFreeMeals: result.hasFreeMeals,
                },
                data: result.foods,
            });
        }));
    }
}
exports.default = new FeedController();
