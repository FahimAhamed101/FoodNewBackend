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
const food_model_1 = require("../models/food.model");
const category_model_1 = require("../models/category.model");
const AppError_1 = __importDefault(require("../utils/AppError"));
const mongoose_1 = require("mongoose");
const activityLog_service_1 = __importDefault(require("./activityLog.service"));
const auditLog_model_1 = require("../models/auditLog.model");
const compliance_service_1 = __importDefault(require("./compliance.service"));
class FoodService {
    verifyCategoryExists(categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(categoryId)) {
                throw new AppError_1.default('Category not found', 404, 'CATEGORY_NOT_FOUND_ERROR');
            }
            const category = yield category_model_1.Category.findById(new mongoose_1.Types.ObjectId(categoryId));
            if (!category) {
                throw new AppError_1.default('Category not found', 404, 'CATEGORY_NOT_FOUND_ERROR');
            }
            return category;
        });
    }
    createFood(providerId, foodData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { categoryId, title, baseRevenue, serviceFee, productDescription, image } = foodData;
            // Image must come from uploaded file handled by controller/upload middleware
            if (!image) {
                throw new AppError_1.default('Image upload is required', 400, 'IMAGE_REQUIRED');
            }
            yield this.verifyCategoryExists(categoryId);
            const existingFood = yield food_model_1.Food.findOne({
                categoryId: new mongoose_1.Types.ObjectId(categoryId),
                title: { $regex: new RegExp(`^${title}$`, 'i') },
            });
            if (existingFood) {
                throw new AppError_1.default('Food item with this title already exists in this category', 400, 'DUPLICATE_FOOD_ERROR');
            }
            const finalPriceTag = Number(baseRevenue) + Number(serviceFee);
            const food = yield food_model_1.Food.create(Object.assign(Object.assign({}, foodData), { providerId: new mongoose_1.Types.ObjectId(providerId), categoryId: new mongoose_1.Types.ObjectId(categoryId), finalPriceTag }));
            // 🔥 Compliance Scan for Alcohol Keywords
            yield compliance_service_1.default.scanFoodItem(food._id, new mongoose_1.Types.ObjectId(providerId), title, productDescription);
            // Log the activity
            yield activityLog_service_1.default.logActivity({
                userId: providerId,
                eventType: auditLog_model_1.AuditEventType.MENU_ITEM_CREATED,
                action: `Added new menu item: ${food.title}`,
                resource: 'Food',
                metadata: {
                    foodId: food._id,
                    providerId: providerId,
                    categoryId: food.categoryId
                }
            });
            return food;
        });
    }
    getProviderFoods(providerId, filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const { categoryId, categoryName, status, page = 1, limit = 10 } = filters;
            const query = { providerId: new mongoose_1.Types.ObjectId(providerId) };
            if (categoryId) {
                yield this.verifyCategoryExists(categoryId);
                query.categoryId = new mongoose_1.Types.ObjectId(categoryId);
            }
            else if (categoryName) {
                const escapedName = categoryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const category = yield category_model_1.Category.findOne({
                    categoryName: { $regex: new RegExp(`^${escapedName}$`, 'i') },
                });
                if (!category) {
                    throw new AppError_1.default(`Category '${categoryName}' not found`, 404, 'CATEGORY_NOT_FOUND_ERROR');
                }
                query.categoryId = category._id;
            }
            if (status === 'active') {
                query.foodStatus = true;
            }
            else if (status === 'inactive') {
                query.foodStatus = false;
            }
            const skip = (Number(page) - 1) * Number(limit);
            const [foods, total] = yield Promise.all([
                food_model_1.Food.find(query)
                    .populate('categoryId', 'categoryName')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit))
                    .lean(),
                food_model_1.Food.countDocuments(query),
            ]);
            const transformedFoods = foods.map((food) => {
                var _a;
                return ({
                    foodId: food._id,
                    title: food.title,
                    categoryName: ((_a = food.categoryId) === null || _a === void 0 ? void 0 : _a.categoryName) || 'Unknown',
                    image: food.image,
                    finalPriceTag: food.finalPriceTag,
                    foodAvailability: food.foodAvailability,
                    foodStatus: food.foodStatus,
                    createdAt: food.createdAt,
                });
            });
            return {
                foods: transformedFoods,
                meta: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                },
            };
        });
    }
    getFoodsByCategory(categoryId, providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.verifyCategoryExists(categoryId);
            return yield food_model_1.Food.find({
                categoryId: new mongoose_1.Types.ObjectId(categoryId),
                providerId: new mongoose_1.Types.ObjectId(providerId),
            }).sort('-createdAt');
        });
    }
    getFoodById(foodId, providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const food = yield food_model_1.Food.findOne({
                _id: new mongoose_1.Types.ObjectId(foodId),
                providerId: new mongoose_1.Types.ObjectId(providerId),
            }).populate('categoryId', 'categoryName');
            if (!food) {
                throw new AppError_1.default('Food item not found or you do not have permission', 404, 'NOT_FOUND_ERROR');
            }
            return food;
        });
    }
    updateFood(foodId, providerId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            const food = yield food_model_1.Food.findOne({
                _id: new mongoose_1.Types.ObjectId(foodId),
                providerId: new mongoose_1.Types.ObjectId(providerId),
            });
            if (!food) {
                throw new AppError_1.default('Food item not found or you do not have permission', 404, 'NOT_FOUND_ERROR');
            }
            if (updateData.categoryId && updateData.categoryId.toString() !== food.categoryId.toString()) {
                yield this.verifyCategoryExists(updateData.categoryId);
            }
            if (updateData.baseRevenue !== undefined || updateData.serviceFee !== undefined) {
                const br = updateData.baseRevenue !== undefined ? updateData.baseRevenue : food.baseRevenue;
                const sf = updateData.serviceFee !== undefined ? updateData.serviceFee : food.serviceFee;
                updateData.finalPriceTag = Number(br) + Number(sf);
            }
            if (updateData.title && updateData.title !== food.title) {
                const catId = updateData.categoryId || food.categoryId;
                const existing = yield food_model_1.Food.findOne({
                    categoryId: new mongoose_1.Types.ObjectId(catId),
                    title: { $regex: new RegExp(`^${updateData.title}$`, 'i') },
                    _id: { $ne: food._id },
                });
                if (existing) {
                    throw new AppError_1.default('Another food item with this title already exists in this category', 400, 'DUPLICATE_FOOD_ERROR');
                }
            }
            Object.assign(food, updateData);
            yield food.save();
            // 🔥 Re-scan Compliance if text changed
            if (updateData.title || updateData.productDescription) {
                yield compliance_service_1.default.scanFoodItem(food._id, new mongoose_1.Types.ObjectId(providerId), food.title, food.productDescription || '');
            }
            return food;
        });
    }
    deleteFood(foodId, providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const food = yield food_model_1.Food.findOneAndDelete({
                _id: new mongoose_1.Types.ObjectId(foodId),
                providerId: new mongoose_1.Types.ObjectId(providerId),
            });
            if (!food) {
                throw new AppError_1.default('Food item not found or you do not have permission', 404, 'NOT_FOUND_ERROR');
            }
            return food;
        });
    }
    searchPublicFoods(queryParams) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, category, rating, page = 1, limit = 20 } = queryParams;
            const query = { foodStatus: true }; // Only active foods
            // 1. Name Filter (Partial Match)
            if (name) {
                query.title = { $regex: new RegExp(name, 'i') };
            }
            // 2. Category Filter (Name or ID)
            if (category) {
                if (mongoose_1.Types.ObjectId.isValid(category)) {
                    query.categoryId = new mongoose_1.Types.ObjectId(category);
                }
                else {
                    // Find category by name first
                    const catDoc = yield category_model_1.Category.findOne({ categoryName: { $regex: new RegExp(`^${category}$`, 'i') } });
                    if (catDoc) {
                        query.categoryId = catDoc._id;
                    }
                    else {
                        // Category not found implies no foods for this query
                        return { foods: [], total: 0 };
                    }
                }
            }
            // 3. Rating Filter (Minimum)
            if (rating) {
                query.rating = { $gte: Number(rating) };
            }
            const skip = (Number(page) - 1) * Number(limit);
            const [foods, total] = yield Promise.all([
                food_model_1.Food.find(query)
                    .populate('categoryId', 'categoryName')
                    .populate('providerId', 'fullName email phone') // Fetch provider details
                    .sort({ rating: -1, createdAt: -1 }) // Best rated first
                    .skip(skip)
                    .limit(Number(limit)),
                food_model_1.Food.countDocuments(query)
            ]);
            return { foods, total, page: Number(page), limit: Number(limit) };
        });
    }
}
exports.default = new FoodService();
