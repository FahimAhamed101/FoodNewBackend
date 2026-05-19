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
const payment_model_1 = require("../models/payment.model");
class PaymentRepository {
    /**
     * Get financial metrics for provider
     */
    getMetrics(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const now = new Date();
            const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            const metrics = yield payment_model_1.Payment.aggregate([
                {
                    $facet: {
                        currentMonthRevenue: [
                            {
                                $match: {
                                    providerId,
                                    status: payment_model_1.PaymentStatus.COMPLETED,
                                    createdAt: { $gte: startOfCurrentMonth },
                                },
                            },
                            { $group: { _id: null, total: { $sum: '$netAmount' } } },
                        ],
                        lastMonthRevenue: [
                            {
                                $match: {
                                    providerId,
                                    status: payment_model_1.PaymentStatus.COMPLETED,
                                    createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
                                },
                            },
                            { $group: { _id: null, total: { $sum: '$netAmount' } } },
                        ],
                        totalCommission: [
                            {
                                $match: {
                                    providerId,
                                    status: payment_model_1.PaymentStatus.COMPLETED,
                                },
                            },
                            { $group: { _id: null, total: { $sum: '$commission' } } },
                        ],
                        pendingPayout: [
                            {
                                $match: {
                                    providerId,
                                    status: payment_model_1.PaymentStatus.COMPLETED,
                                    payoutStatus: payment_model_1.PayoutStatus.PENDING,
                                },
                            },
                            { $group: { _id: null, total: { $sum: '$netAmount' } } },
                        ],
                    },
                },
            ]);
            const data = metrics[0];
            const currentRev = ((_a = data.currentMonthRevenue[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
            const lastRev = ((_b = data.lastMonthRevenue[0]) === null || _b === void 0 ? void 0 : _b.total) || 0;
            const commission = ((_c = data.totalCommission[0]) === null || _c === void 0 ? void 0 : _c.total) || 0;
            const pending = ((_d = data.pendingPayout[0]) === null || _d === void 0 ? void 0 : _d.total) || 0;
            // Calculate growth percentage
            let growth = 0;
            if (lastRev > 0) {
                growth = ((currentRev - lastRev) / lastRev) * 100;
            }
            else if (currentRev > 0) {
                growth = 100; // 100% growth if starting from data-less month
            }
            return {
                growthThisMonth: parseFloat(growth.toFixed(2)),
                commissionPaid: parseFloat(commission.toFixed(2)),
                pendingPayoutAmount: parseFloat(pending.toFixed(2)),
            };
        });
    }
    /**
     * Get paginated payment history
     */
    getHistory(providerId, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const skip = (page - 1) * limit;
            const [payments, total] = yield Promise.all([
                payment_model_1.Payment.find({ providerId })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .select('createdAt orderId paymentId totalAmount donationAmount status netAmount commission payoutStatus')
                    .lean(),
                payment_model_1.Payment.countDocuments({ providerId }),
            ]);
            return {
                payments: payments.map(p => ({
                    id: p._id,
                    paymentId: p.paymentId,
                    orderId: p.orderId,
                    dateTime: p.createdAt,
                    amount: p.totalAmount,
                    donationAmount: p.donationAmount || 0,
                    netAmount: p.netAmount,
                    commission: p.commission,
                    status: p.status,
                    payoutStatus: p.payoutStatus
                })),
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                },
            };
        });
    }
    /**
     * Search payments by ID or Order ID
     */
    searchPayments(providerId, query) {
        return __awaiter(this, void 0, void 0, function* () {
            // Use regex for partial, case-insensitive match if needed, 
            // but exact match on IDs is usually preferred for security/performance.
            // Prompt asks for "Case-insensitive" Search.
            const searchRegex = new RegExp(query, 'i');
            const results = yield payment_model_1.Payment.find({
                providerId,
                $or: [
                    { paymentId: { $regex: searchRegex } },
                    { orderId: { $regex: searchRegex } }
                ]
            })
                .sort({ createdAt: -1 })
                .limit(20) // Limit search results
                .select('createdAt orderId paymentId totalAmount donationAmount status netAmount payoutStatus')
                .lean();
            return results;
        });
    }
}
exports.default = new PaymentRepository();
