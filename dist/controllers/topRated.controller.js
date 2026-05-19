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
const topRated_service_1 = __importDefault(require("../services/topRated.service"));
class TopRatedController {
    constructor() {
        /**
         * GET /api/v1/top-rated/restaurants
         * Get top rated restaurants (rating >= 4.5)
         */
        this.getTopRestaurants = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield topRated_service_1.default.getTopRestaurants(req.query);
            res.status(200).json({
                success: true,
                meta: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit
                },
                data: result.restaurants
            });
        }));
        /**
         * GET /api/v1/top-rated/foods
         * Get top rated foods (rating >= 4.5)
         */
        this.getTopFoods = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield topRated_service_1.default.getTopFoods(req.query);
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
    }
}
exports.default = new TopRatedController();
