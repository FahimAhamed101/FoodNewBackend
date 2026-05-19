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
const adminRestaurant_service_1 = __importDefault(require("../services/adminRestaurant.service"));
class AdminRestaurantController {
    constructor() {
        this.getDashboardStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { restaurantId } = req.params;
            const stats = yield adminRestaurant_service_1.default.getDashboardStats(restaurantId);
            res.status(200).json({ status: 'success', data: stats });
        }));
        this.getProfile = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { restaurantId } = req.params;
            const profile = yield adminRestaurant_service_1.default.getProfile(restaurantId);
            res.status(200).json({ status: 'success', data: profile });
        }));
        this.getPickupWindows = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { restaurantId } = req.params;
            const windows = yield adminRestaurant_service_1.default.getPickupWindows(restaurantId);
            res.status(200).json({ status: 'success', data: windows });
        }));
        this.getActivitySummary = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { restaurantId } = req.params;
            const summary = yield adminRestaurant_service_1.default.getActivitySummary(restaurantId);
            res.status(200).json({ status: 'success', data: summary });
        }));
        this.getCompliance = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { restaurantId } = req.params;
            const compliance = yield adminRestaurant_service_1.default.getCompliance(restaurantId);
            res.status(200).json({ status: 'success', data: compliance });
        }));
        this.getLocation = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { restaurantId } = req.params;
            const location = yield adminRestaurant_service_1.default.getLocation(restaurantId);
            res.status(200).json({ status: 'success', data: location });
        }));
        this.blockRestaurant = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { restaurantId } = req.params;
            const { reason } = req.body;
            yield adminRestaurant_service_1.default.blockRestaurant(restaurantId, reason);
            res.status(200).json({ status: 'success', message: 'Restaurant blocked successfully' });
        }));
        this.unblockRestaurant = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { restaurantId } = req.params;
            yield adminRestaurant_service_1.default.unblockRestaurant(restaurantId);
            res.status(200).json({ status: 'success', message: 'Restaurant unblocked successfully' });
        }));
        this.approveRestaurant = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { restaurantId } = req.params;
            const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            yield adminRestaurant_service_1.default.approveRestaurant(restaurantId, adminId);
            res.status(200).json({ status: 'success', message: 'Restaurant approved successfully' });
        }));
        this.rejectRestaurant = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { restaurantId } = req.params;
            const { reason } = req.body;
            const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            yield adminRestaurant_service_1.default.rejectRestaurant(restaurantId, reason, adminId);
            res.status(200).json({ status: 'success', message: 'Restaurant rejected successfully' });
        }));
        this.getProviderOrderHistory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { providerId } = req.params;
            const orders = yield adminRestaurant_service_1.default.getProviderOrderHistory(providerId);
            res.status(200).json({
                success: true,
                count: orders.length,
                orders
            });
        }));
        this.getProviderReviews = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { providerId } = req.params;
            const { rating, page, limit } = req.query;
            const result = yield adminRestaurant_service_1.default.getProviderReviews(providerId, {
                rating: rating ? Number(rating) : undefined,
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 20
            });
            res.status(200).json({
                success: true,
                data: result.reviews,
                pagination: result.pagination
            });
        }));
        this.getAllRestaurants = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            // Pass entire query object to service
            const result = yield adminRestaurant_service_1.default.getAllRestaurants(req.query);
            res.status(200).json({
                success: true,
                pagination: result.pagination,
                restaurants: result.restaurants
            });
        }));
        this.getRestaurantDetails = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { restaurantId } = req.params;
            const restaurant = yield adminRestaurant_service_1.default.getRestaurantDetails(restaurantId);
            res.status(200).json({
                success: true,
                data: restaurant
            });
        }));
    }
}
exports.default = new AdminRestaurantController();
