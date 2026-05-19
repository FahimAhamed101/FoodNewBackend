import { Types } from 'mongoose';
import { Payment, PaymentStatus, PayoutStatus } from '../models/payment.model';
import { ProviderProfile } from '../models/providerProfile.model';
import { User } from '../models/user.model';
import stripe from '../config/stripe';
import AppError from '../utils/AppError';

interface PayoutSummary {
    providerId: string;
    providerName: string;
    providerEmail: string;
    pendingAmount: number;
    pendingOrdersCount: number;
    lastPayoutDate?: Date;
    stripeConnectedAccountId?: string;
}

interface PayoutHistory {
    payoutId: string;
    providerId: string;
    providerName: string;
    amount: number;
    ordersCount: number;
    method: 'stripe' | 'manual';
    status: 'completed' | 'pending' | 'failed';
    reference?: string;
    createdAt: Date;
}

class AdminPayoutService {
    /**
     * Get all providers with pending payouts
     */
    async getPendingPayouts(filters?: {
        minAmount?: number;
        providerId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        providers: PayoutSummary[];
        pagination: any;
        totalPendingAmount: number;
    }> {
        const { minAmount = 0, providerId, page = 1, limit = 20 } = filters || {};
        const skip = (page - 1) * limit;

        // Build match query
        const matchQuery: any = {
            status: PaymentStatus.COMPLETED,
            payoutStatus: PayoutStatus.PENDING,
        };

        if (providerId) {
            matchQuery.providerId = new Types.ObjectId(providerId);
        }

        // Aggregate pending payouts by provider
        const result = await Payment.aggregate([
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
    }

    /**
     * Process payout to a provider using Stripe Transfer
     */
    async processStripePayout(
        providerId: string,
        adminId: string
    ): Promise<{
        success: boolean;
        message: string;
        payout: any;
    }> {
        // Get provider info
        const provider = await ProviderProfile.findOne({ providerId: new Types.ObjectId(providerId) });
        if (!provider) {
            throw new AppError('Provider not found', 404, 'PROVIDER_NOT_FOUND');
        }

        // Check if provider has Stripe Connected Account
        const stripeAccountId = (provider as any).stripeConnectedAccountId;
        if (!stripeAccountId) {
            throw new AppError(
                'Provider has not connected their Stripe account. Please ask them to complete onboarding.',
                400,
                'NO_STRIPE_ACCOUNT'
            );
        }

        // Get pending payments
        const pendingPayments = await Payment.find({
            providerId: new Types.ObjectId(providerId),
            status: PaymentStatus.COMPLETED,
            payoutStatus: PayoutStatus.PENDING,
        });

        if (pendingPayments.length === 0) {
            throw new AppError('No pending payouts for this provider', 400, 'NO_PENDING_PAYOUTS');
        }

        // Calculate total amount
        const totalAmount = pendingPayments.reduce((sum, p) => sum + p.netAmount, 0);

        if (totalAmount <= 0) {
            throw new AppError('Payout amount must be greater than 0', 400, 'INVALID_AMOUNT');
        }

        try {
            // Create Stripe Transfer
            const transfer = await stripe.transfers.create({
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
            await Payment.updateMany(
                { _id: { $in: pendingPayments.map((p) => p._id) } },
                {
                    $set: {
                        payoutStatus: PayoutStatus.SETTLED,
                        stripeTransferId: transfer.id,
                    },
                }
            );

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
        } catch (error: any) {
            throw new AppError(
                `Stripe transfer failed: ${error.message}`,
                500,
                'STRIPE_TRANSFER_FAILED'
            );
        }
    }

    /**
     * Mark payout as settled manually (for bank transfers, etc.)
     */
    async markPayoutAsSettled(
        providerId: string,
        adminId: string,
        data: {
            reference: string;
            notes?: string;
        }
    ): Promise<{
        success: boolean;
        message: string;
        payout: any;
    }> {
        const { reference, notes } = data;

        if (!reference) {
            throw new AppError('Payment reference is required', 400, 'REFERENCE_REQUIRED');
        }

        // Get pending payments
        const pendingPayments = await Payment.find({
            providerId: new Types.ObjectId(providerId),
            status: PaymentStatus.COMPLETED,
            payoutStatus: PayoutStatus.PENDING,
        });

        if (pendingPayments.length === 0) {
            throw new AppError('No pending payouts for this provider', 400, 'NO_PENDING_PAYOUTS');
        }

        const totalAmount = pendingPayments.reduce((sum, p) => sum + p.netAmount, 0);

        // Update all payments to settled
        await Payment.updateMany(
            { _id: { $in: pendingPayments.map((p) => p._id) } },
            {
                $set: {
                    payoutStatus: PayoutStatus.SETTLED,
                    stripeTransferId: reference, // Store reference in this field
                },
            }
        );

        // Get provider info
        const provider = await ProviderProfile.findOne({ providerId: new Types.ObjectId(providerId) });

        return {
            success: true,
            message: `Manually marked $${totalAmount.toFixed(2)} as paid to ${provider?.restaurantName || 'provider'}`,
            payout: {
                reference,
                amount: totalAmount,
                ordersCount: pendingPayments.length,
                notes,
                provider: {
                    id: providerId,
                    name: provider?.restaurantName,
                },
            },
        };
    }

    /**
     * Get payout history
     */
    async getPayoutHistory(filters?: {
        providerId?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        payouts: any[];
        pagination: any;
        summary: any;
    }> {
        const { providerId, startDate, endDate, page = 1, limit = 20 } = filters || {};
        const skip = (page - 1) * limit;

        // Build match query
        const matchQuery: any = {
            payoutStatus: PayoutStatus.SETTLED,
        };

        if (providerId) {
            matchQuery.providerId = new Types.ObjectId(providerId);
        }

        if (startDate || endDate) {
            matchQuery.updatedAt = {};
            if (startDate) matchQuery.updatedAt.$gte = new Date(startDate);
            if (endDate) matchQuery.updatedAt.$lte = new Date(endDate);
        }

        // Aggregate payouts
        const result = await Payment.aggregate([
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
    }

    /**
     * Get provider payout details
     */
    async getProviderPayoutDetails(providerId: string): Promise<any> {
        const provider = await ProviderProfile.findOne({ providerId: new Types.ObjectId(providerId) });
        if (!provider) {
            throw new AppError('Provider not found', 404, 'PROVIDER_NOT_FOUND');
        }

        // Get pending amount
        const pendingResult = await Payment.aggregate([
            {
                $match: {
                    providerId: new Types.ObjectId(providerId),
                    status: PaymentStatus.COMPLETED,
                    payoutStatus: PayoutStatus.PENDING,
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
        const paidResult = await Payment.aggregate([
            {
                $match: {
                    providerId: new Types.ObjectId(providerId),
                    payoutStatus: PayoutStatus.SETTLED,
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
                email: (provider as any).email || '',
                stripeConnectedAccountId: (provider as any).stripeConnectedAccountId,
                hasStripeAccount: !!(provider as any).stripeConnectedAccountId,
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
    }
}

export default new AdminPayoutService();
