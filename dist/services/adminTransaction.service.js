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
const mongoose_1 = require("mongoose");
const order_model_1 = require("../models/order.model");
const providerProfile_model_1 = require("../models/providerProfile.model");
class AdminTransactionService {
    /**
     * Get Transactions & Orders analytics for a specific Provider or all Providers
     */
    getTransactions(providerId_1) {
        return __awaiter(this, arguments, void 0, function* (providerId, page = 1, limit = 20, status, timeRange, startDate, endDate) {
            const skip = (page - 1) * limit;
            let providerProfile = null;
            // Build Match Query
            const matchQuery = {};
            if (providerId && providerId !== 'all_status' && providerId !== '') {
                try {
                    const providerObjectId = new mongoose_1.Types.ObjectId(providerId);
                    providerProfile = yield providerProfile_model_1.ProviderProfile.findOne({ providerId: providerObjectId });
                    matchQuery.providerId = providerObjectId;
                }
                catch (err) {
                    // If invalid ID, don't crash, just skip filter (or throw error, but let's be safe)
                }
            }
            if (status && status !== 'all_status') {
                matchQuery.status = status;
            }
            // Add Date Range Filter
            if (timeRange) {
                const dateFilter = this.getDateRangeFilter(timeRange, startDate, endDate);
                if (dateFilter) {
                    matchQuery.createdAt = dateFilter;
                }
            }
            const result = yield order_model_1.Order.aggregate([
                { $match: matchQuery },
                {
                    $facet: {
                        // Summary Metrics (Revenue)
                        summary: [
                            {
                                $group: {
                                    _id: null,
                                    grossRevenue: { $sum: '$totalPrice' },
                                    platformEarnings: { $sum: '$platformFee' }
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    grossRevenue: 1,
                                    platformEarnings: 1,
                                    netRestaurantEarnings: { $subtract: ['$grossRevenue', '$platformEarnings'] }
                                }
                            }
                        ],
                        // Transactions List
                        transactions: [
                            { $sort: { createdAt: -1 } },
                            { $skip: skip },
                            { $limit: limit },
                            // Lookup Customer Info from Users
                            {
                                $lookup: {
                                    from: 'users',
                                    localField: 'customerId',
                                    foreignField: '_id',
                                    as: 'customerInfo'
                                }
                            },
                            {
                                $unwind: {
                                    path: '$customerInfo',
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            // Lookup Provider/Restaurant info
                            {
                                $lookup: {
                                    from: 'providerprofiles',
                                    localField: 'providerId',
                                    foreignField: 'providerId',
                                    as: 'providerInfo'
                                }
                            },
                            {
                                $unwind: {
                                    path: '$providerInfo',
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    orderId: 1,
                                    customer: { $ifNull: ['$customerInfo.fullName', 'Unknown Customer'] },
                                    restaurant: { $ifNull: ['$providerInfo.restaurantName', 'Unknown Restaurant'] },
                                    pickupTime: { $ifNull: ['$pickupTime', 'Not Scheduled'] },
                                    status: 1,
                                    amount: '$totalPrice',
                                    platformFee: { $ifNull: ['$platformFee', 0] }
                                }
                            }
                        ],
                        // Total Count
                        totalCount: [
                            { $count: 'count' }
                        ]
                    }
                }
            ]);
            const summaryData = result[0].summary[0] || { grossRevenue: 0, platformEarnings: 0, netRestaurantEarnings: 0 };
            const transactionsData = result[0].transactions || [];
            const totalOrdersCount = result[0].totalCount[0] ? result[0].totalCount[0].count : 0;
            const totalPages = Math.ceil(totalOrdersCount / limit);
            return {
                restaurantsid: providerId || 'Global',
                restaurantsName: providerProfile ? providerProfile.restaurantName : 'All Restaurants',
                summary: {
                    grossRevenue: Math.round(summaryData.grossRevenue * 100) / 100,
                    platformEarnings: Math.round(summaryData.platformEarnings * 100) / 100,
                    netRestaurantEarnings: Math.round(summaryData.netRestaurantEarnings * 100) / 100
                },
                pagination: {
                    page,
                    limit,
                    totalOrders: totalOrdersCount,
                    totalPages
                },
                transactions: transactionsData
            };
        });
    }
    /**
     * Helper to calculate date ranges
     */
    getDateRangeFilter(range, customStart, customEnd) {
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        switch (range) {
            case 'today':
                return { $gte: startOfDay };
            case 'this_week': {
                const startOfWeek = new Date(now);
                const day = startOfWeek.getDay() || 7; // Get current day number, make Sunday (0) -> 7
                if (day !== 1)
                    startOfWeek.setHours(-24 * (day - 1));
                else
                    startOfWeek.setHours(0, 0, 0, 0);
                startOfWeek.setHours(0, 0, 0, 0);
                return { $gte: startOfWeek };
            }
            case 'this_month': {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return { $gte: startOfMonth };
            }
            case 'this_year': {
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                return { $gte: startOfYear };
            }
            case 'custom': {
                if (!customStart || !customEnd)
                    return null;
                const start = new Date(customStart);
                const end = new Date(customEnd);
                // Ensure valid dates
                if (isNaN(start.getTime()) || isNaN(end.getTime()))
                    return null;
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                return { $gte: start, $lte: end };
            }
            default:
                return null;
        }
    }
}
exports.default = new AdminTransactionService();
