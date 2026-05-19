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
const analytics_service_1 = __importDefault(require("../services/analytics.service"));
const catchAsync_1 = require("../utils/catchAsync");
class AnalyticsController {
    constructor() {
        this.getInsights = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const insights = yield analytics_service_1.default.getProviderInsights(providerId);
            res.status(200).json({
                status: 'success',
                data: insights,
            });
        }));
        this.getOverview = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const data = yield analytics_service_1.default.getOverview(providerId);
            res.status(200).json({ status: 'success', data });
        }));
        this.getRevenue = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const data = yield analytics_service_1.default.getRevenuePerformance(providerId);
            res.status(200).json({ status: 'success', data });
        }));
        this.getOrders = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const data = yield analytics_service_1.default.getOrderDistribution(providerId);
            res.status(200).json({ status: 'success', data });
        }));
        this.getUserDistribution = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const data = yield analytics_service_1.default.getUserDistribution(providerId);
            res.status(200).json({ status: 'success', data });
        }));
        this.getCategoryMix = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const data = yield analytics_service_1.default.getCategoryMix(providerId);
            res.status(200).json({ status: 'success', data });
        }));
        this.getHourlyActivity = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const data = yield analytics_service_1.default.getHourlyActivity(providerId);
            res.status(200).json({ status: 'success', data });
        }));
    }
}
exports.default = new AnalyticsController();
