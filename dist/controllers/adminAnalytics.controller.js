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
const adminAnalytics_service_1 = __importDefault(require("../services/adminAnalytics.service"));
const date_utils_1 = require("../utils/date.utils");
class AdminAnalyticsController {
    constructor() {
        this.getOverview = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { filter, startDate, endDate } = req.query;
            const range = (0, date_utils_1.getDateRange)(filter, startDate, endDate);
            const metrics = yield adminAnalytics_service_1.default.getOverviewMetrics(range);
            res.status(200).json({
                success: true,
                data: metrics
            });
        }));
        this.getRevenueAnalytics = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { filter, startDate, endDate } = req.query;
            const range = (0, date_utils_1.getDateRange)(filter, startDate, endDate);
            const analytics = yield adminAnalytics_service_1.default.getTrendAnalytics(filter, range, 'revenue');
            res.status(200).json({
                success: true,
                data: {
                    labels: analytics.labels,
                    values: analytics.values,
                    totalRevenue: analytics.totalValue
                }
            });
        }));
        this.getOrderAnalytics = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { filter, startDate, endDate } = req.query;
            const range = (0, date_utils_1.getDateRange)(filter, startDate, endDate);
            const analytics = yield adminAnalytics_service_1.default.getTrendAnalytics(filter, range, 'orders');
            res.status(200).json({
                success: true,
                data: {
                    labels: analytics.labels,
                    values: analytics.values,
                    totalOrders: analytics.totalOrders
                }
            });
        }));
        this.getRecentOrders = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const data = yield adminAnalytics_service_1.default.getRecentOrders(page, limit);
            res.status(200).json({
                success: true,
                data: data.orders,
                pagination: data.pagination
            });
        }));
        this.getRecentReviews = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const reviews = yield adminAnalytics_service_1.default.getRecentReviews();
            res.status(200).json({
                success: true,
                data: reviews
            });
        }));
        this.getTrendingMenus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { filter, startDate, endDate } = req.query;
            const range = (0, date_utils_1.getDateRange)(filter, startDate, endDate);
            const trendingMenus = yield adminAnalytics_service_1.default.getTrendingMenus(range);
            res.status(200).json({
                status: 'success',
                data: {
                    trendingMenus
                }
            });
        }));
        this.getTopRestaurants = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { filter, startDate, endDate } = req.query;
            const range = (0, date_utils_1.getDateRange)(filter, startDate, endDate);
            const topRestaurants = yield adminAnalytics_service_1.default.getTopRestaurants(range);
            res.status(200).json({
                status: 'success',
                data: {
                    topRestaurants
                }
            });
        }));
        this.getMasterAnalytics = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { filter, startDate, endDate } = req.query;
            const range = (0, date_utils_1.getDateRange)(filter, startDate, endDate);
            const data = yield adminAnalytics_service_1.default.getMasterAnalytics(filter, range);
            res.status(200).json({
                status: 'success',
                data
            });
        }));
        this.getAnalyticsReports = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { filter, startDate, endDate } = req.query;
            const range = (0, date_utils_1.getDateRange)(filter, startDate, endDate);
            const reports = yield adminAnalytics_service_1.default.getAnalyticsReports(filter, range);
            res.status(200).json({
                success: true,
                data: reports
            });
        }));
    }
}
exports.default = new AdminAnalyticsController();
