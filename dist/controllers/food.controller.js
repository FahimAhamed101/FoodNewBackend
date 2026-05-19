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
const food_service_1 = __importDefault(require("../services/food.service"));
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = __importDefault(require("../utils/AppError"));
const parseNumber = (value) => {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
};
const parseBoolean = (value) => {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true')
            return true;
        if (normalized === 'false')
            return false;
    }
    return undefined;
};
const normalizeFoodPayload = (payload) => {
    const normalized = Object.assign({}, payload);
    const calories = parseNumber(payload.calories);
    if (calories !== undefined)
        normalized.calories = calories;
    const baseRevenue = parseNumber(payload.baseRevenue);
    if (baseRevenue !== undefined)
        normalized.baseRevenue = baseRevenue;
    const serviceFee = parseNumber(payload.serviceFee);
    if (serviceFee !== undefined)
        normalized.serviceFee = serviceFee;
    const foodAvailability = parseBoolean(payload.foodAvailability);
    if (foodAvailability !== undefined)
        normalized.foodAvailability = foodAvailability;
    const foodStatus = parseBoolean(payload.foodStatus);
    if (foodStatus !== undefined)
        normalized.foodStatus = foodStatus;
    return normalized;
};
class FoodController {
    constructor() {
        this.createFood = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            if (!req.file) {
                throw new AppError_1.default('Product image file is required', 400, 'IMAGE_REQUIRED');
            }
            const uploadedImage = req.file.path;
            if (!uploadedImage) {
                throw new AppError_1.default('Uploaded image could not be processed', 400, 'IMAGE_UPLOAD_ERROR');
            }
            const foodData = normalizeFoodPayload(req.body);
            foodData.image = uploadedImage;
            const food = yield food_service_1.default.createFood(providerId, foodData);
            res.status(201).json({
                success: true,
                data: food,
            });
        }));
        this.getOwnFoods = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const result = yield food_service_1.default.getProviderFoods(providerId, req.query);
            res.status(200).json({
                success: true,
                results: result.foods.length,
                meta: result.meta,
                data: result.foods,
            });
        }));
        this.getFoodsByCategory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const categoryId = req.params.categoryId;
            const foods = yield food_service_1.default.getFoodsByCategory(categoryId, providerId);
            res.status(200).json({
                success: true,
                results: foods.length,
                data: foods,
            });
        }));
        this.getFoodById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const foodId = req.params.id;
            const food = yield food_service_1.default.getFoodById(foodId, providerId);
            res.status(200).json({
                success: true,
                data: food,
            });
        }));
        this.updateFood = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const foodId = req.params.id;
            const updateData = normalizeFoodPayload(req.body);
            delete updateData.image;
            if (req.file) {
                const uploadedImage = req.file.path;
                if (!uploadedImage) {
                    throw new AppError_1.default('Uploaded image could not be processed', 400, 'IMAGE_UPLOAD_ERROR');
                }
                updateData.image = uploadedImage;
            }
            const food = yield food_service_1.default.updateFood(foodId, providerId, updateData);
            res.status(200).json({
                success: true,
                data: food,
            });
        }));
        this.deleteFood = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const foodId = req.params.id;
            yield food_service_1.default.deleteFood(foodId, providerId);
            res.status(200).json({
                success: true,
                message: 'Food item deleted successfully from database',
            });
        }));
        this.searchFoods = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield food_service_1.default.searchPublicFoods(req.query);
            // Format data to match specs: name mapped from title, price from finalPriceTag
            const formattedData = result.foods.map((food) => {
                var _a, _b;
                return ({
                    food_id: food._id,
                    name: food.title,
                    category: ((_a = food.categoryId) === null || _a === void 0 ? void 0 : _a.categoryName) || 'Unknown',
                    provider: ((_b = food.providerId) === null || _b === void 0 ? void 0 : _b.fullName) || 'Unknown', // Simulating provider name
                    rating: food.rating || 0,
                    price: food.finalPriceTag,
                    productDescription: food.productDescription,
                    image: food.image
                });
            });
            res.status(200).json({
                success: true,
                page: result.page,
                limit: result.limit,
                total: result.total,
                data: formattedData
            });
        }));
    }
}
exports.default = new FoodController();
