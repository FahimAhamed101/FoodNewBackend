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
const providerProfile_model_1 = require("../models/providerProfile.model");
const user_model_1 = require("../models/user.model");
const AppError_1 = __importDefault(require("../utils/AppError"));
const profile_model_1 = require("../models/profile.model");
class AdminCustomerService {
    getCustomerDashboard(customerId_1) {
        return __awaiter(this, arguments, void 0, function* (customerId, page = 1, limit = 10) {
            const skip = (page - 1) * limit;
            const customerObjectId = new mongoose_1.Types.ObjectId(customerId);
            // check if customer exists
            const user = yield user_model_1.User.findById(customerObjectId);
            if (!user) {
                throw new AppError_1.default('Customer not found', 404);
            }
            // Aggregation Pipeline
            const result = yield order_model_1.Order.aggregate([
                {
                    $match: {
                        customerId: customerObjectId
                    }
                },
                {
                    $facet: {
                        // Summary Metrics
                        summary: [
                            {
                                $group: {
                                    _id: null,
                                    totalOrders: { $sum: 1 },
                                    totalSpent: { $sum: '$totalPrice' }
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    totalOrders: 1,
                                    totalSpent: 1,
                                    avgOrderValue: {
                                        $cond: {
                                            if: { $eq: ['$totalOrders', 0] },
                                            then: 0,
                                            else: { $divide: ['$totalSpent', '$totalOrders'] }
                                        }
                                    }
                                }
                            }
                        ],
                        // Paginated Orders List
                        orders: [
                            { $sort: { createdAt: -1 } },
                            { $skip: skip },
                            { $limit: limit },
                            // Lookup restaurant details (ProviderProfile)
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
                                    status: 1,
                                    restaurant: { $ifNull: ['$providerInfo.restaurantName', 'Unknown Restaurant'] },
                                    date: '$createdAt',
                                    amount: '$totalPrice'
                                }
                            }
                        ],
                        // Total Count for Pagination
                        totalCount: [
                            { $count: 'count' }
                        ]
                    }
                }
            ]);
            const summaryData = result[0].summary[0] || { totalOrders: 0, totalSpent: 0, avgOrderValue: 0 };
            const ordersData = result[0].orders || [];
            const totalOrdersCount = result[0].totalCount[0] ? result[0].totalCount[0].count : 0;
            const totalPages = Math.ceil(totalOrdersCount / limit);
            return {
                CustomarId: customerId,
                CustomarName: user.fullName,
                summary: {
                    totalOrders: summaryData.totalOrders,
                    totalSpent: Math.round(summaryData.totalSpent * 100) / 100,
                    avgOrderValue: Math.round(summaryData.avgOrderValue * 100) / 100
                },
                pagination: {
                    page,
                    limit,
                    totalOrders: totalOrdersCount,
                    totalPages
                },
                orders: ordersData
            };
        });
    }
    getCustomerProfileDashboard(customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const customerObjectId = new mongoose_1.Types.ObjectId(customerId);
            const user = yield user_model_1.User.findById(customerObjectId).lean();
            if (!user) {
                throw new AppError_1.default('User not found', 404);
            }
            let stateStr = "Not provided";
            let profilePic = user.profilePic || "";
            const profile = yield profile_model_1.Profile.findOne({ userId: customerObjectId }).lean();
            if (profile) {
                stateStr = profile.city && profile.state ? `${profile.city} , ${profile.state}` : (profile.state || profile.city || "Not provided");
                profilePic = profile.profilePic || profile.avatar || profilePic;
            }
            else {
                const providerProfile = yield providerProfile_model_1.ProviderProfile.findOne({ providerId: customerObjectId }).lean();
                if (providerProfile) {
                    stateStr = providerProfile.city && providerProfile.state ? `${providerProfile.city} , ${providerProfile.state}` : (providerProfile.state || providerProfile.city || "Not provided");
                    profilePic = providerProfile.profile || profilePic;
                }
            }
            return {
                Name: user.fullName,
                profilePick: profilePic,
                isActive: (_a = user.isActive) !== null && _a !== void 0 ? _a : true,
                CustomerID: user._id,
                email: user.email,
                phoen: user.phone || "Not provided",
                state: stateStr,
                date: user.createdAt
            };
        });
    }
}
exports.default = new AdminCustomerService();
