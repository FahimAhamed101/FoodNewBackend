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
const provider_service_1 = __importDefault(require("../services/provider.service"));
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = __importDefault(require("../utils/AppError"));
class ProviderController {
    constructor() {
        /**
         * Get nearby providers based on customer location
         * POST /api/v1/providers/nearby
         */
        this.getNearbyProviders = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { latitude, longitude, radius, page, limit, cuisine, sortBy } = req.body;
            const result = yield provider_service_1.default.getNearbyProviders({
                latitude,
                longitude,
                radius,
                page,
                limit,
                cuisine,
                sortBy
            });
            res.status(200).json({
                success: true,
                message: `Found ${result.providers.length} providers within ${radius} km`,
                data: result.providers,
                pagination: result.pagination,
                filters: {
                    radius: `${radius} km`,
                    cuisine: cuisine || 'all',
                    sortBy
                }
            });
        }));
        /**
         * Get nearby restaurants with donated checkout food.
         * GET|POST /api/v1/provider/donated-foods/nearby
         */
        this.getNearbyDonatedFoods = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const input = (req.method === 'GET' ? req.query : req.body);
            const { latitude, longitude, radius, page, limit, cuisine, sortBy } = input;
            const result = yield provider_service_1.default.getNearbyDonatedFoods({
                latitude,
                longitude,
                radius,
                page,
                limit,
                cuisine,
                sortBy
            });
            res.status(200).json({
                success: true,
                message: `Found ${result.pagination.total} donated foods`,
                data: result.donatedFoods,
                pagination: result.pagination
            });
        }));
        this.getCustomerDetails = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const customerId = req.params.customerId;
            if (typeof customerId !== 'string' || !customerId.match(/^[0-9a-fA-F]{24}$/)) {
                throw new AppError_1.default('Invalid Customer ID', 400, 'VALIDATION_ERROR');
            }
            const data = yield provider_service_1.default.getCustomerDetails(providerId, customerId);
            res.status(200).json({
                success: true,
                data,
            });
        }));
        this.getReadyOrders = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = yield provider_service_1.default.getReadyOrders(providerId, page, limit);
            res.status(200).json({
                success: true,
                data: result.orders,
                pagination: result.pagination
            });
        }));
        this.getOrders = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const status = req.query.status || 'all';
            const result = yield provider_service_1.default.getOrders(providerId, page, limit, status);
            res.status(200).json({
                success: true,
                data: result.orders,
                pagination: result.pagination
            });
        }));
    }
}
exports.default = new ProviderController();
