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
const category_service_1 = __importDefault(require("../services/category.service"));
const catchAsync_1 = require("../utils/catchAsync");
class CategoryController {
    constructor() {
        this.createCategory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const image = req.body.image || (req.file ? req.file.path : '');
            const category = yield category_service_1.default.createCategory(Object.assign(Object.assign({}, req.body), { image,
                providerId }));
            res.status(201).json({
                success: true,
                data: category,
            });
        }));
        this.getOwnCategories = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const categories = yield category_service_1.default.getProviderCategories(providerId);
            res.status(200).json({
                success: true,
                results: categories.length,
                data: categories,
            });
        }));
        this.getAllCategories = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const categories = yield category_service_1.default.getAllCategories();
            res.status(200).json({
                success: true,
                results: categories.length,
                data: categories,
            });
        }));
        this.getCategoryById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const categoryId = req.params.id;
            const category = yield category_service_1.default.getCategoryById(categoryId, providerId);
            res.status(200).json({
                success: true,
                data: category,
            });
        }));
        this.updateCategory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const categoryId = req.params.id;
            const image = req.body.image || (req.file ? req.file.path : undefined);
            const updateData = Object.assign(Object.assign({}, req.body), (image ? { image } : {}));
            const category = yield category_service_1.default.updateCategory(categoryId, providerId, updateData);
            res.status(200).json({
                success: true,
                data: category,
            });
        }));
        this.deleteCategory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const categoryId = req.params.id;
            yield category_service_1.default.deleteCategory(categoryId, providerId);
            res.status(200).json({
                success: true,
                message: 'Category deleted successfully from database',
            });
        }));
    }
}
exports.default = new CategoryController();
