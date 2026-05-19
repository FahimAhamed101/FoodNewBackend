import { Response } from 'express';
import { AuthRequest } from '../middlewares/authenticate';
import { catchAsync } from '../utils/catchAsync';
import adminPayoutService from '../services/adminPayout.service';
import AppError from '../utils/AppError';

class AdminPayoutController {
    /**
     * GET /api/v1/admin/payouts/pending
     * Get all providers with pending payouts
     */
    getPendingPayouts = catchAsync(async (req: AuthRequest, res: Response) => {
        const { minAmount, providerId, page, limit } = req.query;

        const result = await adminPayoutService.getPendingPayouts({
            minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
            providerId: providerId as string,
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
        });

        res.status(200).json({
            success: true,
            message: 'Pending payouts retrieved successfully',
            data: result,
        });
    });

    /**
     * POST /api/v1/admin/payouts/process/:providerId
     * Process payout using Stripe Transfer
     */
    processStripePayout = catchAsync(async (req: AuthRequest, res: Response) => {
        const { providerId } = req.params;
        const adminId = req.user!.userId;

        if (!providerId || Array.isArray(providerId)) {
            throw new AppError('Provider ID is required', 400, 'PROVIDER_ID_REQUIRED');
        }

        const result = await adminPayoutService.processStripePayout(providerId, adminId);

        res.status(200).json({
            success: true,
            message: result.message,
            data: result.payout,
        });
    });

    /**
     * POST /api/v1/admin/payouts/mark-settled/:providerId
     * Mark payout as settled manually (bank transfer, etc.)
     */
    markPayoutAsSettled = catchAsync(async (req: AuthRequest, res: Response) => {
        const { providerId } = req.params;
        const adminId = req.user!.userId;
        const { reference, notes } = req.body;

        if (!providerId || Array.isArray(providerId)) {
            throw new AppError('Provider ID is required', 400, 'PROVIDER_ID_REQUIRED');
        }

        if (!reference) {
            throw new AppError('Payment reference is required', 400, 'REFERENCE_REQUIRED');
        }

        const result = await adminPayoutService.markPayoutAsSettled(providerId, adminId, {
            reference,
            notes,
        });

        res.status(200).json({
            success: true,
            message: result.message,
            data: result.payout,
        });
    });

    /**
     * GET /api/v1/admin/payouts/history
     * Get payout history
     */
    getPayoutHistory = catchAsync(async (req: AuthRequest, res: Response) => {
        const { providerId, startDate, endDate, page, limit } = req.query;

        const result = await adminPayoutService.getPayoutHistory({
            providerId: providerId as string,
            startDate: startDate as string,
            endDate: endDate as string,
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
        });

        res.status(200).json({
            success: true,
            message: 'Payout history retrieved successfully',
            data: result,
        });
    });

    /**
     * GET /api/v1/admin/payouts/provider/:providerId
     * Get provider payout details
     */
    getProviderPayoutDetails = catchAsync(async (req: AuthRequest, res: Response) => {
        const { providerId } = req.params;

        if (!providerId || Array.isArray(providerId)) {
            throw new AppError('Provider ID is required', 400, 'PROVIDER_ID_REQUIRED');
        }

        const result = await adminPayoutService.getProviderPayoutDetails(providerId);

        res.status(200).json({
            success: true,
            message: 'Provider payout details retrieved successfully',
            data: result,
        });
    });
}

export default new AdminPayoutController();
