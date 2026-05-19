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
const adminDashboard_service_1 = __importDefault(require("../services/adminDashboard.service"));
const AppError_1 = __importDefault(require("../utils/AppError"));
class AdminDashboardController {
    constructor() {
        this.getAnalytics = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { providerId } = req.query;
            if (!providerId) {
                throw new AppError_1.default('providerId query parameter is required', 400);
            }
            const data = yield adminDashboard_service_1.default.getAnalyticsOverview(providerId);
            res.status(200).json(Object.assign({ success: true }, data));
        }));
        this.getFeedback = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { providerId } = req.query;
            if (!providerId) {
                throw new AppError_1.default('providerId query parameter is required', 400);
            }
            const data = yield adminDashboard_service_1.default.getCustomerFeedback(providerId);
            res.status(200).json(Object.assign({ success: true }, data));
        }));
        this.getTopRestaurants = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 5;
            const data = yield adminDashboard_service_1.default.getTopPerformingRestaurants(page, limit);
            res.status(200).json({
                success: true,
                TopPerformingRestaurants: data
            });
        }));
        /**
         * GET /api/admin/detailed-stats?timeRange=today|week|month|year
         */
        this.getDetailedStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { timeRange = 'today', startDate, endDate } = req.query;
            const data = yield adminDashboard_service_1.default.getDashboardDetailedStats(timeRange, startDate, endDate);
            res.status(200).json({
                success: true,
                data
            });
        }));
    }
}
exports.default = new AdminDashboardController();
