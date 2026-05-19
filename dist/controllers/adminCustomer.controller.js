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
const AppError_1 = __importDefault(require("../utils/AppError"));
const adminCustomer_service_1 = __importDefault(require("../services/adminCustomer.service"));
const adminRestaurant_service_1 = __importDefault(require("../services/adminRestaurant.service"));
class AdminCustomerController {
    constructor() {
        this.getCustomerDashboard = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { customerId } = req.params;
            const page = parseInt(String(req.query.page || '1'), 10);
            const limit = parseInt(String(req.query.limit || '10'), 10);
            if (!customerId) {
                throw new AppError_1.default('Customer ID is required', 400);
            }
            const result = yield adminCustomer_service_1.default.getCustomerDashboard(customerId, page, limit);
            res.status(200).json({
                success: true,
                CustomarId: result.CustomarId,
                CustomarName: result.CustomarName,
                summary: result.summary,
                pagination: result.pagination,
                orders: result.orders
            });
        }));
        this.getAllRestaurantsDashboard = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield adminRestaurant_service_1.default.getAllRestaurantsDetailed(req.query);
            res.status(200).json(Object.assign({ success: true }, result));
        }));
        this.getCustomerProfileDashboard = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { customerId } = req.params;
            if (!customerId) {
                throw new AppError_1.default('Customer ID is required', 400);
            }
            const result = yield adminCustomer_service_1.default.getCustomerProfileDashboard(customerId);
            res.status(200).json(Object.assign({ success: true }, result));
        }));
    }
}
exports.default = new AdminCustomerController();
