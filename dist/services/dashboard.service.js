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
const food_model_1 = require("../models/food.model");
const review_model_1 = require("../models/review.model");
const mongoose_1 = require("mongoose");
class DashboardService {
    getDashboardOverview(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const pId = new mongoose_1.Types.ObjectId(providerId);
            const [revenueData, totalOrders, totalProducts, ratingData, statusData] = yield Promise.all([
                order_model_1.Order.aggregate([
                    { $match: { providerId: pId, status: order_model_1.OrderStatus.PICKED_UP } },
                    { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
                ]),
                order_model_1.Order.countDocuments({ providerId: pId }),
                food_model_1.Food.countDocuments({ providerId: pId, foodStatus: true }),
                review_model_1.Review.aggregate([
                    { $match: { providerId: pId } },
                    { $group: { _id: null, avgRating: { $avg: '$rating' } } },
                ]),
                order_model_1.Order.aggregate([
                    { $match: { providerId: pId } },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ])
            ]);
            const statusCounts = statusData.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {});
            return {
                totalRevenue: ((_a = revenueData[0]) === null || _a === void 0 ? void 0 : _a.totalRevenue) || 0,
                totalOrders,
                totalProducts,
                avgRating: ((_b = ratingData[0]) === null || _b === void 0 ? void 0 : _b.avgRating) ? parseFloat(ratingData[0].avgRating.toFixed(1)) : 0,
                orderStatusSummary: {
                    allOrders: totalOrders,
                    pendingOrders: statusCounts[order_model_1.OrderStatus.PENDING] || 0,
                    preparingOrders: statusCounts[order_model_1.OrderStatus.PREPARING] || 0,
                    readyOrders: statusCounts[order_model_1.OrderStatus.READY_FOR_PICKUP] || 0,
                    completedOrders: (statusCounts[order_model_1.OrderStatus.COMPLETED] || 0) + (statusCounts[order_model_1.OrderStatus.PICKED_UP] || 0), // Assuming Picked Up is completed for this view, or separate them
                    cancelledOrders: statusCounts[order_model_1.OrderStatus.CANCELLED] || 0
                }
            };
        });
    }
    getRevenueAnalytics(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const pId = new mongoose_1.Types.ObjectId(providerId);
            const revenueByDay = yield order_model_1.Order.aggregate([
                {
                    $match: {
                        providerId: pId,
                        status: order_model_1.OrderStatus.PICKED_UP,
                    },
                },
                {
                    $group: {
                        _id: { $dayOfWeek: '$createdAt' },
                        totalPrice: { $sum: '$totalPrice' },
                    },
                },
            ]);
            const daysMap = {
                1: 'Sun', 2: 'Mon', 3: 'Tue', 4: 'Wed', 5: 'Thu', 6: 'Fri', 7: 'Sat'
            };
            const result = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
                day,
                price: 0
            }));
            revenueByDay.forEach(item => {
                const dayName = daysMap[item._id];
                const dayIndex = result.findIndex(r => r.day === dayName);
                if (dayIndex !== -1) {
                    result[dayIndex].price = item.totalPrice;
                }
            });
            return result;
        });
    }
    getPopularDishes(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const pId = new mongoose_1.Types.ObjectId(providerId);
            const popularDishes = yield order_model_1.Order.aggregate([
                {
                    $match: {
                        providerId: pId,
                        status: {
                            $in: [
                                order_model_1.OrderStatus.COMPLETED,
                                order_model_1.OrderStatus.PICKED_UP,
                                order_model_1.OrderStatus.READY_FOR_PICKUP,
                                order_model_1.OrderStatus.PREPARING
                            ]
                        }
                    }
                },
                { $unwind: '$items' },
                {
                    $group: {
                        _id: '$items.foodId',
                        totalSold: { $sum: '$items.quantity' },
                        totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
                    },
                },
                {
                    $lookup: {
                        from: 'foods',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'foodDetails',
                    },
                },
                { $unwind: '$foodDetails' },
                { $match: { 'foodDetails.foodStatus': true } }, // Only active foods
                {
                    $project: {
                        foodId: '$_id',
                        title: '$foodDetails.title',
                        image: '$foodDetails.image',
                        totalSold: 1,
                        totalRevenue: 1,
                    },
                },
                { $sort: { totalSold: -1, totalRevenue: -1 } },
                { $limit: 3 },
            ]);
            return popularDishes;
        });
    }
    getRecentOrders(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const pId = new mongoose_1.Types.ObjectId(providerId);
            const recentOrders = yield order_model_1.Order.find({ providerId: pId })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('customerId', 'fullName email profilePic googlePicture')
                .select('orderId customerId logisticsType paymentMethod status donationAmount totalPrice createdAt');
            return recentOrders.map(order => {
                const customer = order.customerId;
                return {
                    orderId: order.orderId,
                    customerName: (customer === null || customer === void 0 ? void 0 : customer.fullName) || 'Unknown',
                    customerAvatar: (customer === null || customer === void 0 ? void 0 : customer.profilePic) || (customer === null || customer === void 0 ? void 0 : customer.googlePicture) || '',
                    logisticsType: order.logisticsType,
                    paymentMethod: order.paymentMethod,
                    status: order.status,
                    donationAmount: order.donationAmount || 0,
                    totalPrice: order.totalPrice,
                    createdAt: order.createdAt,
                };
            });
        });
    }
    getUnifiedDashboardData(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [dashboardOverview, revenueAnalytics, popularTopDishes, recentOrders] = yield Promise.all([
                this.getDashboardOverview(providerId),
                this.getRevenueAnalytics(providerId),
                this.getPopularDishes(providerId),
                this.getRecentOrders(providerId),
            ]);
            return {
                dashboardOverview,
                revenueAnalytics,
                popularTopDishes,
                recentOrders,
            };
        });
    }
}
exports.default = new DashboardService();
