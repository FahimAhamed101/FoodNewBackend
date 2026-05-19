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
const mongoose_1 = require("mongoose");
const order_model_1 = require("../models/order.model");
const review_model_1 = require("../models/review.model");
const AppError_1 = __importDefault(require("../utils/AppError"));
class AdminDashboardService {
    /**
     * API 1: Orders & Analytics Overview
     * Fetch overall statistics for a specific restaurant/provider.
     */
    getAnalyticsOverview(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!mongoose_1.Types.ObjectId.isValid(providerId)) {
                throw new AppError_1.default('Invalid Provider ID', 400);
            }
            const pId = new mongoose_1.Types.ObjectId(providerId);
            const stats = yield order_model_1.Order.aggregate([
                { $match: { providerId: pId } },
                {
                    $facet: {
                        orderCounts: [
                            {
                                $group: {
                                    _id: '$status',
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        profitData: [
                            {
                                $group: {
                                    _id: null,
                                    totalPlatformProfit: { $sum: '$platformFee' }
                                }
                            }
                        ]
                    }
                }
            ]);
            const orderCountsRaw = stats[0].orderCounts;
            const profit = ((_a = stats[0].profitData[0]) === null || _a === void 0 ? void 0 : _a.totalPlatformProfit) || 0;
            // Process status counts
            const statusMap = {
                totalOrders: 0,
                pendingOrders: 0,
                completedOrders: 0
            };
            orderCountsRaw.forEach((item) => {
                statusMap.totalOrders += item.count;
                if (item._id === order_model_1.OrderStatus.PENDING) {
                    statusMap.pendingOrders += item.count;
                }
                else if (item._id === order_model_1.OrderStatus.COMPLETED || item._id === order_model_1.OrderStatus.PICKED_UP) {
                    statusMap.completedOrders += item.count;
                }
            });
            // Sustainability Metric: 0.5kg CO2 reduced per completed order as a proxy for delivery optimization
            const co2Reduced = statusMap.completedOrders * 0.5;
            return {
                OrdersOverview: {
                    totalOrders: statusMap.totalOrders,
                    pendingOrders: statusMap.pendingOrders,
                    completedOrders: statusMap.completedOrders
                },
                "CO2Reduced(kg)": co2Reduced,
                platformProfit: parseFloat(profit.toFixed(2))
            };
        });
    }
    /**
     * API 2: Customer Feedback
     * Get aggregated customer ratings for the restaurant/provider.
     */
    getCustomerFeedback(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(providerId)) {
                throw new AppError_1.default('Invalid Provider ID', 400);
            }
            const pId = new mongoose_1.Types.ObjectId(providerId);
            const feedback = yield review_model_1.Review.aggregate([
                { $match: { providerId: pId } },
                {
                    $group: {
                        _id: '$rating',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
            const ratingDistribution = {
                "1Stars": 0,
                "2Stars": 0,
                "3Stars": 0,
                "4Stars": 0,
                "5Stars": 0
            };
            feedback.forEach((item) => {
                const key = `${item._id}Stars`;
                if (ratingDistribution.hasOwnProperty(key)) {
                    ratingDistribution[key] = item.count;
                }
            });
            return {
                CustomerFeedback: ratingDistribution
            };
        });
    }
    /**
     * API 3: Top Performing Restaurants
     * Fetch top performing restaurants across the platform.
     */
    getTopPerformingRestaurants() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 5) {
            const skip = (page - 1) * limit;
            const results = yield order_model_1.Order.aggregate([
                {
                    $match: {
                        status: { $in: [order_model_1.OrderStatus.COMPLETED, order_model_1.OrderStatus.PICKED_UP] }
                    }
                },
                {
                    $group: {
                        _id: '$providerId',
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: '$totalPrice' }
                    }
                },
                { $sort: { totalRevenue: -1, totalOrders: -1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'providerprofiles',
                        localField: '_id',
                        foreignField: 'providerId',
                        as: 'profile'
                    }
                },
                { $unwind: '$profile' },
                {
                    $project: {
                        _id: 0,
                        providerId: '$_id',
                        RestaurantName: '$profile.restaurantName',
                        TotalOrders: '$totalOrders',
                        TotalRevenue: { $round: ['$totalRevenue', 2] }
                    }
                }
            ]);
            return results.map((item, index) => (Object.assign({ Rank: skip + index + 1 }, item)));
        });
    }
    /**
     * API 4: Dashboard Detailed Stats (for charts)
     * Handles 4 types of analysis: Income, Volume, Active Customers, and State-based.
     */
    getDashboardDetailedStats() {
        return __awaiter(this, arguments, void 0, function* (timeRange = 'today', customStartDate, customEndDate) {
            const now = new Date();
            let startDate;
            let endDate = now;
            let groupBy;
            let format;
            switch (timeRange.toLowerCase()) {
                case 'custom':
                    if (!customStartDate || !customEndDate) {
                        throw new AppError_1.default('Custom date range requires startDate and endDate (DD-MM-YYYY)', 400);
                    }
                    const [sDay, sMonth, sYear] = customStartDate.split('-').map(Number);
                    const [eDay, eMonth, eYear] = customEndDate.split('-').map(Number);
                    startDate = new Date(sYear, sMonth - 1, sDay, 0, 0, 0);
                    endDate = new Date(eYear, eMonth - 1, eDay, 23, 59, 59);
                    groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
                    format = "Custom";
                    break;
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
                    format = "Daily";
                    break;
                case 'month':
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
                    groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
                    format = "Daily";
                    break;
                case 'year':
                    startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                    groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
                    format = "Monthly";
                    break;
                case 'today':
                default:
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    groupBy = { $hour: "$createdAt" };
                    format = "Hourly";
                    break;
            }
            const matchStage = {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $ne: order_model_1.OrderStatus.CANCELLED }
                }
            };
            const stats = yield order_model_1.Order.aggregate([
                matchStage,
                {
                    $facet: {
                        incomeAndVol: [
                            {
                                $group: {
                                    _id: groupBy,
                                    totalIncome: { $sum: "$totalPrice" },
                                    orderCount: { $sum: 1 }
                                }
                            },
                            { $sort: { _id: 1 } }
                        ],
                        activeCustomers: [
                            {
                                $group: {
                                    _id: groupBy,
                                    customers: { $addToSet: "$customerId" }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    customerCount: { $size: "$customers" }
                                }
                            },
                            { $sort: { _id: 1 } }
                        ],
                        stateAnalysis: [
                            {
                                $group: {
                                    _id: "$state",
                                    count: { $sum: 1 }
                                }
                            },
                            { $sort: { count: -1 } },
                            { $limit: 10 }
                        ]
                    }
                }
            ]);
            const result = stats[0];
            return {
                timeRange,
                format,
                incomeOverview: result.incomeAndVol.map((item) => ({
                    label: item._id,
                    income: parseFloat(item.totalIncome.toFixed(2))
                })),
                orderVolume: result.incomeAndVol.map((item) => ({
                    label: item._id,
                    count: item.orderCount
                })),
                activeCustomers: result.activeCustomers.map((item) => ({
                    label: item._id,
                    count: item.customerCount
                })),
                stateAnalysis: result.stateAnalysis.map((item) => ({
                    state: item._id || 'Unknown',
                    count: item.count
                }))
            };
        });
    }
}
exports.default = new AdminDashboardService();
