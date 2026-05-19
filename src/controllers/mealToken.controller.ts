import { Response } from 'express';
import { AuthRequest } from '../middlewares/authenticate';
import { catchAsync } from '../utils/catchAsync';
import mealTokenService from '../services/mealToken.service';
import AppError from '../utils/AppError';

class MealTokenController {
    /**
     * GET /api/v1/donation/breakdown?mealCount=5
     * Calculate price before payment
     */
    getBreakdown = catchAsync(async (req: AuthRequest, res: Response) => {
        const donorUserId = req.user!.userId;
        const mealCount = parseInt(req.query.mealCount as string);

        if (!mealCount || mealCount < 1) {
            throw new AppError('mealCount must be at least 1', 400, 'INVALID_INPUT');
        }

        const breakdown = await mealTokenService.calculateDonationBreakdown(donorUserId, mealCount);

        res.status(200).json({
            success: true,
            data: breakdown,
        });
    });

    /**
     * POST /api/v1/donation/create-payment-intent
     * Body: { mealCount: 5 }
     */
    createDonationPaymentIntent = catchAsync(async (req: AuthRequest, res: Response) => {
        const donorUserId = req.user!.userId;
        const { mealCount } = req.body;

        if (!mealCount || mealCount < 1) {
            throw new AppError('mealCount must be at least 1', 400, 'INVALID_INPUT');
        }

        const result = await mealTokenService.createDonationPaymentIntent(donorUserId, mealCount);

        res.status(200).json({
            success: true,
            message: 'Donation payment intent created',
            data: {
                clientSecret: result.clientSecret,
                paymentIntentId: result.paymentIntentId,
                breakdown: result.breakdown,
            },
        });
    });

    /**
     * POST /api/v1/donation/confirm-payment
     * Body: { paymentIntentId: "pi_xxx" }
     * Called after Stripe payment succeeds on frontend
     */
    confirmDonationPayment = catchAsync(async (req: AuthRequest, res: Response) => {
        const { paymentIntentId } = req.body;

        if (!paymentIntentId) {
            throw new AppError('paymentIntentId is required', 400, 'INVALID_INPUT');
        }

        const result = await mealTokenService.handleDonationPaymentSuccess(paymentIntentId);

        res.status(200).json({
            success: true,
            message: `${result.mealCount} meal token(s) created successfully`,
            data: {
                orderId: (result.order as any).orderId,
                tokensCreated: result.mealCount,
                tokens: result.tokens,
            },
        });
    });

    /**
     * GET /api/v1/donation/my-tokens
     * Donor sees their own tokens
     */
    getMyTokens = catchAsync(async (req: AuthRequest, res: Response) => {
        const donorUserId = req.user!.userId;
        const result = await mealTokenService.getMyTokens(donorUserId);

        res.status(200).json({
            success: true,
            data: result,
        });
    });

    /**
     * GET /api/v1/donation/available-count
     * Public — how many free meals are available + list of claimable tokenIds
     */
    getAvailableCount = catchAsync(async (req: AuthRequest, res: Response) => {
        const result = await mealTokenService.getAvailableTokenCount();

        res.status(200).json({
            success: true,
            data: result,
        });
    });

    /**
     * GET /api/v1/donation/daily-quota
     * User sees their remaining daily free meal quota
     */
    getDailyQuota = catchAsync(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.userId;
        const quota = await mealTokenService.getDailyQuota(userId);

        res.status(200).json({
            success: true,
            data: quota,
        });
    });

    /**
     * POST /api/v1/donation/claim/:tokenId
     * User claims a free meal token
     */
    claimFreeMeal = catchAsync(async (req: AuthRequest, res: Response) => {
        const claimerUserId = req.user!.userId;
        const { tokenId } = req.params;

        if (!tokenId || Array.isArray(tokenId)) {
            throw new AppError('tokenId is required', 400, 'INVALID_INPUT');
        }

        const token = await mealTokenService.claimFreeMeal(claimerUserId, tokenId);

        res.status(200).json({
            success: true,
            message: 'Free meal claimed successfully! Place your order now.',
            data: {
                token,
                note: 'You can now place a free order. Daily limit: 2 free meals.',
            },
        });
    });

    /**
     * POST /api/v1/donation/place-free-order
     * Body: { tokenId, providerId, foodId, quantity }
     * User places a free meal order using a claimed token
     *
     * Money flow:
     *   User pays:        $0
     *   Restaurant gets:  $5.49 (pricePerMeal - platformFee)
     *   Platform keeps:   $0.50
     */
    placeFreeMealOrder = catchAsync(async (req: AuthRequest, res: Response) => {
        const claimerUserId = req.user!.userId;
        const { tokenId, providerId, foodId, quantity } = req.body;

        if (!tokenId || !providerId || !foodId) {
            throw new AppError(
                'tokenId, providerId and foodId are required',
                400,
                'INVALID_INPUT'
            );
        }

        const result = await mealTokenService.placeFreeMealOrder(claimerUserId, {
            tokenId,
            providerId,
            foodId,
            quantity: quantity || 1,
        });

        res.status(201).json({
            success: true,
            message: 'Free meal order placed successfully!',
            data: {
                orderId: (result.order as any).orderId,
                status: (result.order as any).status,
                moneyFlow: result.moneyFlow,
            },
        });
    });

    /**
     * Admin: GET /api/v1/admin/donation/tokens
     */
    adminGetAllTokens = catchAsync(async (req: AuthRequest, res: Response) => {
        const filters = {
            status: req.query.status as string,
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 20,
        };

        const result = await mealTokenService.adminGetAllTokens(filters);

        res.status(200).json({
            success: true,
            data: result,
        });
    });
}

export default new MealTokenController();
