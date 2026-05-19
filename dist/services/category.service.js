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
const category_model_1 = require("../models/category.model");
const AppError_1 = __importDefault(require("../utils/AppError"));
const mongoose_1 = require("mongoose");
class CategoryService {
    createCategory(categoryData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { providerId, categoryName } = categoryData;
            const existingCategory = yield category_model_1.Category.findOne({
                providerId: new mongoose_1.Types.ObjectId(providerId),
                categoryName: { $regex: new RegExp(`^${categoryName}$`, 'i') },
            });
            if (existingCategory) {
                throw new AppError_1.default('Category with this name already exists for your profile', 400, 'DUPLICATE_CATEGORY_ERROR');
            }
            const category = yield category_model_1.Category.create(Object.assign(Object.assign({}, categoryData), { providerId: new mongoose_1.Types.ObjectId(providerId) }));
            return category;
        });
    }
    getProviderCategories(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield category_model_1.Category.find({ providerId: new mongoose_1.Types.ObjectId(providerId) }).sort('-createdAt');
        });
    }
    getAllCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield category_model_1.Category.find({ categoryStatus: true }).sort('categoryName');
        });
    }
    getCategoryById(categoryId, providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const category = yield category_model_1.Category.findOne({
                _id: new mongoose_1.Types.ObjectId(categoryId),
                providerId: new mongoose_1.Types.ObjectId(providerId),
            });
            if (!category) {
                throw new AppError_1.default('Category not found or you do not have permission', 404, 'NOT_FOUND_ERROR');
            }
            return category;
        });
    }
    updateCategory(categoryId, providerId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            const category = yield category_model_1.Category.findOne({
                _id: new mongoose_1.Types.ObjectId(categoryId),
                providerId: new mongoose_1.Types.ObjectId(providerId),
            });
            if (!category) {
                throw new AppError_1.default('Category not found or you do not have permission', 404, 'NOT_FOUND_ERROR');
            }
            if (updateData.categoryName && updateData.categoryName !== category.categoryName) {
                const existing = yield category_model_1.Category.findOne({
                    providerId: new mongoose_1.Types.ObjectId(providerId),
                    categoryName: { $regex: new RegExp(`^${updateData.categoryName}$`, 'i') },
                    _id: { $ne: category._id },
                });
                if (existing) {
                    throw new AppError_1.default('Another category with this name already exists', 400, 'DUPLICATE_CATEGORY_ERROR');
                }
            }
            Object.assign(category, updateData);
            yield category.save();
            return category;
        });
    }
    deleteCategory(categoryId, providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const category = yield category_model_1.Category.findOneAndDelete({
                _id: new mongoose_1.Types.ObjectId(categoryId),
                providerId: new mongoose_1.Types.ObjectId(providerId),
            });
            if (!category) {
                throw new AppError_1.default('Category not found or you do not have permission', 404, 'NOT_FOUND_ERROR');
            }
            return category;
        });
    }
}
exports.default = new CategoryService();
