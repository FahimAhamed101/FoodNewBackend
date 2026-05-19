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
const dashboard_service_1 = __importDefault(require("../services/dashboard.service"));
const catchAsync_1 = require("../utils/catchAsync");
class DashboardController {
    constructor() {
        this.getOverview = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const stats = yield dashboard_service_1.default.getDashboardOverview(providerId);
            res.status(200).json({
                success: true,
                data: stats,
            });
        }));
        this.getRevenueAnalytics = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const analytics = yield dashboard_service_1.default.getRevenueAnalytics(providerId);
            res.status(200).json({
                success: true,
                data: analytics,
            });
        }));
        this.getPopularDishes = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const dishes = yield dashboard_service_1.default.getPopularDishes(providerId);
            res.status(200).json({
                success: true,
                data: dishes,
            });
        }));
        this.getRecentOrders = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const orders = yield dashboard_service_1.default.getRecentOrders(providerId);
            res.status(200).json({
                success: true,
                data: orders,
            });
        }));
        this.getUnifiedDashboard = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const dashboardData = yield dashboard_service_1.default.getUnifiedDashboardData(providerId);
            res.status(200).json({
                success: true,
                data: dashboardData,
            });
        }));
    }
}
exports.default = new DashboardController();
