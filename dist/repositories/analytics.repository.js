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
Object.defineProperty(exports, "__esModule", { value: true });
const order_model_1 = require("../models/order.model");
class AnalyticsRepository {
    /**
     * Get Overview Metrics
     */
    getOverview(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const stats = yield order_model_1.Order.aggregate([
                { $match: { providerId, status: order_model_1.OrderStatus.COMPLETED } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$totalPrice' },
                        totalOrders: { $sum: 1 },
                    },
                },
            ]);
            const topState = yield order_model_1.Order.aggregate([
                { $match: { providerId, status: order_model_1.OrderStatus.COMPLETED } },
                {
                    $lookup: {
                        from: 'profiles',
                        localField: 'customerId',
                        foreignField: 'userId',
                        as: 'customerProfile',
                    },
                },
                { $unwind: '$customerProfile' },
                {
                    $group: {
                        _id: '$customerProfile.state',
                        revenue: { $sum: '$totalPrice' },
                    },
                },
                { $sort: { revenue: -1 } },
                { $limit: 1 },
            ]);
            const data = stats[0] || { totalRevenue: 0, totalOrders: 0 };
            return {
                totalRevenue: data.totalRevenue,
                totalOrders: data.totalOrders,
                avgOrderValue: data.totalOrders > 0 ? parseFloat((data.totalRevenue / data.totalOrders).toFixed(2)) : 0,
                topPerformingState: ((_a = topState[0]) === null || _a === void 0 ? void 0 : _a._id) || 'N/A',
            };
        });
    }
    /**
     * Get Revenue & Order Distribution Performance (Weekly)
     */
    getWeeklyPerformance(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const performance = yield order_model_1.Order.aggregate([
                {
                    $match: {
                        providerId,
                        status: order_model_1.OrderStatus.COMPLETED,
                        createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) },
                    },
                },
                {
                    $group: {
                        _id: { $dayOfWeek: '$createdAt' },
                        revenue: { $sum: '$totalPrice' },
                        orders: { $sum: 1 },
                    },
                },
            ]);
            const revenuePerformance = {};
            const orderDistribution = {};
            // Initialize with 0
            ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(day => {
                revenuePerformance[day] = 0;
                orderDistribution[day] = 0;
            });
            performance.forEach(p => {
                const dayName = daysMap[p._id - 1]; // MongoDB 1 (Sun) to 7 (Sat)
                revenuePerformance[dayName] = p.revenue;
                orderDistribution[dayName] = p.orders;
            });
            return { revenuePerformance, orderDistribution };
        });
    }
    /**
     * Get User Distribution by City
     */
    getUserDistributionByCity(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const distribution = yield order_model_1.Order.aggregate([
                { $match: { providerId, status: order_model_1.OrderStatus.COMPLETED } },
                {
                    $lookup: {
                        from: 'profiles',
                        localField: 'customerId',
                        foreignField: 'userId',
                        as: 'customerProfile',
                    },
                },
                { $unwind: '$customerProfile' },
                {
                    $group: {
                        _id: { $ifNull: ['$customerProfile.city', 'Unknown'] },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { count: -1 } },
            ]);
            const top7 = distribution.slice(0, 7);
            const othersCount = distribution.slice(7).reduce((acc, curr) => acc + curr.count, 0);
            const result = {};
            top7.forEach(item => {
                result[item._id] = item.count;
            });
            if (othersCount > 0) {
                result['Others'] = othersCount;
            }
            return result;
        });
    }
    /**
     * Get Category Mix Analytics
     */
    getCategoryMix(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const categories = yield order_model_1.Order.aggregate([
                { $match: { providerId, status: order_model_1.OrderStatus.COMPLETED } },
                { $unwind: '$items' },
                {
                    $lookup: {
                        from: 'foods',
                        localField: 'items.foodId',
                        foreignField: '_id',
                        as: 'foodInfo',
                    },
                },
                { $unwind: '$foodInfo' },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'foodInfo.categoryId',
                        foreignField: '_id',
                        as: 'categoryInfo',
                    },
                },
                { $unwind: '$categoryInfo' },
                {
                    $group: {
                        _id: '$categoryInfo.categoryName',
                        sales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    },
                },
            ]);
            const totalSales = categories.reduce((acc, curr) => acc + curr.sales, 0);
            const result = {};
            categories.forEach(cat => {
                result[cat._id] = totalSales > 0 ? `${((cat.sales / totalSales) * 100).toFixed(1)}%` : '0%';
            });
            return result;
        });
    }
    /**
     * Get Hourly Peak Activity
     */
    getHourlyPeakActivity(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const hourlyData = yield order_model_1.Order.aggregate([
                { $match: { providerId, status: order_model_1.OrderStatus.COMPLETED } },
                {
                    $group: {
                        _id: { $hour: '$createdAt' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]);
            const result = {};
            // Initialize all 24 hours
            for (let i = 0; i < 24; i++) {
                const hourStr = `${i.toString().padStart(2, '0')}:00`;
                result[hourStr] = 0;
            }
            hourlyData.forEach(item => {
                const hourStr = `${item._id.toString().padStart(2, '0')}:00`;
                result[hourStr] = item.count;
            });
            return result;
        });
    }
}
exports.default = new AnalyticsRepository();
