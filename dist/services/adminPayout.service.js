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
const payment_model_1 = require("../models/payment.model");
const providerProfile_model_1 = require("../models/providerProfile.model");
const stripe_1 = __importDefault(require("../config/stripe"));
const AppError_1 = __importDefault(require("../utils/AppError"));
class AdminPayoutService {
    /**
     * Get all providers with pending payouts
     */
    getPendingPayouts(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const { minAmount = 0, providerId, page = 1, limit = 20 } = filters || {};
            const skip = (page - 1) * limit;
            // Build match query
            const matchQuery = {
                status: payment_model_1.PaymentStatus.COMPLETED,
                payoutStatus: payment_model_1.PayoutStatus.PENDING,
            };
            if (providerId) {
                matchQuery.providerId = new mongoose_1.Types.ObjectId(providerId);
            }
            // Aggregate pending payouts by provider
            const result = yield payment_model_1.Payment.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: '$providerId',
                        pendingAmount: { $sum: '$netAmount' },
                        pendingOrdersCount: { $sum: 1 },
                    },
                },
                {
                    $match: {
                        pendingAmount: { $gte: minAmount },
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                { $unwind: '$user' },
                {
                    $lookup: {
                        from: 'providerprofiles',
                        localField: '_id',
                        foreignField: 'providerId',
                        as: 'profile',
                    },
                },
                { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        providerId: '$_id',
                        providerName: '$profile.restaurantName',
                        providerEmail: '$user.email',
                        pendingAmount: 1,
                        pendingOrdersCount: 1,
                        stripeConnectedAccountId: '$profile.stripeConnectedAccountId',
                    },
                },
                { $sort: { pendingAmount: -1 } },
                {
                    $facet: {
                        metadata: [{ $count: 'total' }],
                        data: [{ $skip: skip }, { $limit: limit }],
                        summary: [
                            {
                                $group: {
                                    _id: null,
                                    totalPendingAmount: { $sum: '$pendingAmount' },
                                },
                            },
                        ],
                    },
                },
            ]);
            const metadata = result[0].metadata[0] || { total: 0 };
            const providers = result[0].data || [];
            const summary = result[0].summary[0] || { totalPendingAmount: 0 };
            return {
                providers,
                pagination: {
                    total: metadata.total,
                    page,
                    limit,
                    totalPages: Math.ceil(metadata.total / limit),
                },
                totalPendingAmount: summary.totalPendingAmount,
            };
        });
    }
    /**
     * Process payout to a provider using Stripe Transfer
     */
    processStripePayout(providerId, adminId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get provider info
            const provider = yield providerProfile_model_1.ProviderProfile.findOne({ providerId: new mongoose_1.Types.ObjectId(providerId) });
            if (!provider) {
                throw new AppError_1.default('Provider not found', 404, 'PROVIDER_NOT_FOUND');
            }
            // Check if provider has Stripe Connected Account
            const stripeAccountId = provider.stripeConnectedAccountId;
            if (!stripeAccountId) {
                throw new AppError_1.default('Provider has not connected their Stripe account. Please ask them to complete onboarding.', 400, 'NO_STRIPE_ACCOUNT');
            }
            // Get pending payments
            const pendingPayments = yield payment_model_1.Payment.find({
                providerId: new mongoose_1.Types.ObjectId(providerId),
                status: payment_model_1.PaymentStatus.COMPLETED,
                payoutStatus: payment_model_1.PayoutStatus.PENDING,
            });
            if (pendingPayments.length === 0) {
                throw new AppError_1.default('No pending payouts for this provider', 400, 'NO_PENDING_PAYOUTS');
            }
            // Calculate total amount
            const totalAmount = pendingPayments.reduce((sum, p) => sum + p.netAmount, 0);
            if (totalAmount <= 0) {
                throw new AppError_1.default('Payout amount must be greater than 0', 400, 'INVALID_AMOUNT');
            }
            try {
                // Create Stripe Transfer
                const transfer = yield stripe_1.default.transfers.create({
                    amount: Math.round(totalAmount * 100), // Convert to cents
                    currency: 'usd',
                    destination: stripeAccountId,
                    description: `Payout for ${pendingPayments.length} orders`,
                    metadata: {
                        providerId: providerId,
                        ordersCount: pendingPayments.length.toString(),
                        processedBy: adminId,
                    },
                });
                // Update all payments to settled
                yield payment_model_1.Payment.updateMany({ _id: { $in: pendingPayments.map((p) => p._id) } }, {
                    $set: {
                        payoutStatus: payment_model_1.PayoutStatus.SETTLED,
                        stripeTransferId: transfer.id,
                    },
                });
                return {
                    success: true,
                    message: `Successfully transferred $${totalAmount.toFixed(2)} to ${provider.restaurantName}`,
                    payout: {
                        transferId: transfer.id,
                        amount: totalAmount,
                        ordersCount: pendingPayments.length,
                        provider: {
                            id: providerId,
                            name: provider.restaurantName,
                        },
                    },
                };
            }
            catch (error) {
                throw new AppError_1.default(`Stripe transfer failed: ${error.message}`, 500, 'STRIPE_TRANSFER_FAILED');
            }
        });
    }
    /**
     * Mark payout as settled manually (for bank transfers, etc.)
     */
    markPayoutAsSettled(providerId, adminId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { reference, notes } = data;
            if (!reference) {
                throw new AppError_1.default('Payment reference is required', 400, 'REFERENCE_REQUIRED');
            }
            // Get pending payments
            const pendingPayments = yield payment_model_1.Payment.find({
                providerId: new mongoose_1.Types.ObjectId(providerId),
                status: payment_model_1.PaymentStatus.COMPLETED,
                payoutStatus: payment_model_1.PayoutStatus.PENDING,
            });
            if (pendingPayments.length === 0) {
                throw new AppError_1.default('No pending payouts for this provider', 400, 'NO_PENDING_PAYOUTS');
            }
            const totalAmount = pendingPayments.reduce((sum, p) => sum + p.netAmount, 0);
            // Update all payments to settled
            yield payment_model_1.Payment.updateMany({ _id: { $in: pendingPayments.map((p) => p._id) } }, {
                $set: {
                    payoutStatus: payment_model_1.PayoutStatus.SETTLED,
                    stripeTransferId: reference, // Store reference in this field
                },
            });
            // Get provider info
            const provider = yield providerProfile_model_1.ProviderProfile.findOne({ providerId: new mongoose_1.Types.ObjectId(providerId) });
            return {
                success: true,
                message: `Manually marked $${totalAmount.toFixed(2)} as paid to ${(provider === null || provider === void 0 ? void 0 : provider.restaurantName) || 'provider'}`,
                payout: {
                    reference,
                    amount: totalAmount,
                    ordersCount: pendingPayments.length,
                    notes,
                    provider: {
                        id: providerId,
                        name: provider === null || provider === void 0 ? void 0 : provider.restaurantName,
                    },
                },
            };
        });
    }
    /**
     * Get payout history
     */
    getPayoutHistory(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const { providerId, startDate, endDate, page = 1, limit = 20 } = filters || {};
            const skip = (page - 1) * limit;
            // Build match query
            const matchQuery = {
                payoutStatus: payment_model_1.PayoutStatus.SETTLED,
            };
            if (providerId) {
                matchQuery.providerId = new mongoose_1.Types.ObjectId(providerId);
            }
            if (startDate || endDate) {
                matchQuery.updatedAt = {};
                if (startDate)
                    matchQuery.updatedAt.$gte = new Date(startDate);
                if (endDate)
                    matchQuery.updatedAt.$lte = new Date(endDate);
            }
            // Aggregate payouts
            const result = yield payment_model_1.Payment.aggregate([
                { $match: matchQuery },
                { $sort: { updatedAt: -1 } },
                {
                    $group: {
                        _id: {
                            providerId: '$providerId',
                            transferId: '$stripeTransferId',
                        },
                        amount: { $sum: '$netAmount' },
                        ordersCount: { $sum: 1 },
                        payoutDate: { $first: '$updatedAt' },
                    },
                },
                {
                    $lookup: {
                        from: 'providerprofiles',
                        localField: '_id.providerId',
                        foreignField: 'providerId',
                        as: 'profile',
                    },
                },
                { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        providerId: '$_id.providerId',
                        providerName: '$profile.restaurantName',
                        amount: 1,
                        ordersCount: 1,
                        reference: '$_id.transferId',
                        payoutDate: 1,
                    },
                },
                {
                    $facet: {
                        metadata: [{ $count: 'total' }],
                        data: [{ $skip: skip }, { $limit: limit }],
                        summary: [
                            {
                                $group: {
                                    _id: null,
                                    totalPaidOut: { $sum: '$amount' },
                                    totalPayouts: { $sum: 1 },
                                },
                            },
                        ],
                    },
                },
            ]);
            const metadata = result[0].metadata[0] || { total: 0 };
            const payouts = result[0].data || [];
            const summary = result[0].summary[0] || { totalPaidOut: 0, totalPayouts: 0 };
            return {
                payouts,
                pagination: {
                    total: metadata.total,
                    page,
                    limit,
                    totalPages: Math.ceil(metadata.total / limit),
                },
                summary,
            };
        });
    }
    /**
     * Get provider payout details
     */
    getProviderPayoutDetails(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = yield providerProfile_model_1.ProviderProfile.findOne({ providerId: new mongoose_1.Types.ObjectId(providerId) });
            if (!provider) {
                throw new AppError_1.default('Provider not found', 404, 'PROVIDER_NOT_FOUND');
            }
            // Get pending amount
            const pendingResult = yield payment_model_1.Payment.aggregate([
                {
                    $match: {
                        providerId: new mongoose_1.Types.ObjectId(providerId),
                        status: payment_model_1.PaymentStatus.COMPLETED,
                        payoutStatus: payment_model_1.PayoutStatus.PENDING,
                    },
                },
                {
                    $group: {
                        _id: null,
                        pendingAmount: { $sum: '$netAmount' },
                        pendingOrdersCount: { $sum: 1 },
                    },
                },
            ]);
            // Get total paid out
            const paidResult = yield payment_model_1.Payment.aggregate([
                {
                    $match: {
                        providerId: new mongoose_1.Types.ObjectId(providerId),
                        payoutStatus: payment_model_1.PayoutStatus.SETTLED,
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalPaidOut: { $sum: '$netAmount' },
                        totalPayouts: { $sum: 1 },
                    },
                },
            ]);
            const pending = pendingResult[0] || { pendingAmount: 0, pendingOrdersCount: 0 };
            const paid = paidResult[0] || { totalPaidOut: 0, totalPayouts: 0 };
            return {
                provider: {
                    id: providerId,
                    name: provider.restaurantName,
                    email: provider.email || '',
                    stripeConnectedAccountId: provider.stripeConnectedAccountId,
                    hasStripeAccount: !!provider.stripeConnectedAccountId,
                },
                pending: {
                    amount: pending.pendingAmount,
                    ordersCount: pending.pendingOrdersCount,
                },
                history: {
                    totalPaidOut: paid.totalPaidOut,
                    totalPayouts: paid.totalPayouts,
                },
            };
        });
    }
}
exports.default = new AdminPayoutService();
