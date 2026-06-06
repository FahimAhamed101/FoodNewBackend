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
const catchAsync_1 = require("../utils/catchAsync");
const mealToken_service_1 = __importDefault(require("../services/mealToken.service"));
const AppError_1 = __importDefault(require("../utils/AppError"));
class MealTokenController {
    constructor() {
        /**
         * GET /api/v1/donation/breakdown?mealCount=5
         * Calculate price before payment
         */
        this.getBreakdown = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const donorUserId = req.user.userId;
            const mealCount = parseInt(req.query.mealCount);
            if (!mealCount || mealCount < 1) {
                throw new AppError_1.default('mealCount must be at least 1', 400, 'INVALID_INPUT');
            }
            const breakdown = yield mealToken_service_1.default.calculateDonationBreakdown(donorUserId, mealCount);
            res.status(200).json({
                success: true,
                data: breakdown,
            });
        }));
        /**
         * POST /api/v1/donation/create-payment-intent
         * Body: { mealCount: 5 }
         */
        this.createDonationPaymentIntent = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const donorUserId = req.user.userId;
            const { mealCount } = req.body;
            if (!mealCount || mealCount < 1) {
                throw new AppError_1.default('mealCount must be at least 1', 400, 'INVALID_INPUT');
            }
            const result = yield mealToken_service_1.default.createDonationPaymentIntent(donorUserId, mealCount);
            res.status(200).json({
                success: true,
                message: 'Donation payment intent created',
                data: {
                    clientSecret: result.clientSecret,
                    paymentIntentId: result.paymentIntentId,
                    breakdown: result.breakdown,
                },
            });
        }));
        /**
         * POST /api/v1/donation/confirm-payment
         * Body: { paymentIntentId: "pi_xxx" }
         * Called after Stripe payment succeeds on frontend
         */
        this.confirmDonationPayment = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { paymentIntentId } = req.body;
            if (!paymentIntentId) {
                throw new AppError_1.default('paymentIntentId is required', 400, 'INVALID_INPUT');
            }
            const result = yield mealToken_service_1.default.handleDonationPaymentSuccess(paymentIntentId);
            res.status(200).json({
                success: true,
                message: `${result.mealCount} meal token(s) created successfully`,
                data: {
                    orderId: result.order.orderId,
                    tokensCreated: result.mealCount,
                    tokens: result.tokens,
                },
            });
        }));
        /**
         * GET /api/v1/donation/my-tokens
         * Donor sees their own tokens
         */
        this.getMyTokens = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const donorUserId = req.user.userId;
            const result = yield mealToken_service_1.default.getMyTokens(donorUserId);
            res.status(200).json({
                success: true,
                data: result,
            });
        }));
        /**
         * GET /api/v1/donation/available-count
         * Public — how many free meals are available + list of claimable tokenIds
         */
        this.getAvailableCount = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield mealToken_service_1.default.getAvailableTokenCount();
            res.status(200).json({
                success: true,
                data: result,
            });
        }));
        /**
         * GET /api/v1/donation/daily-quota
         * Legacy route name. Returns free meal cooldown state.
         */
        this.getDailyQuota = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.userId;
            const quota = yield mealToken_service_1.default.getDailyQuota(userId);
            res.status(200).json({
                success: true,
                data: quota,
            });
        }));
        /**
         * POST /api/v1/donation/claim/:tokenId
         * User claims a free meal token. One claim every 48 hours.
         */
        this.claimFreeMeal = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const claimerUserId = req.user.userId;
            const { tokenId } = req.params;
            if (!tokenId || Array.isArray(tokenId)) {
                throw new AppError_1.default('tokenId is required', 400, 'INVALID_INPUT');
            }
            const result = yield mealToken_service_1.default.claimFreeMeal(claimerUserId, tokenId);
            res.status(200).json({
                success: true,
                message: result.reusedExistingClaim
                    ? 'You already have a claimed free meal token. Use it to place your order.'
                    : 'Free meal claimed successfully! Place your order now.',
                data: {
                    token: result.token,
                    reusedExistingClaim: result.reusedExistingClaim,
                    cooldownEndsAt: result.cooldownEndsAt,
                    note: 'You can claim one free donated meal every 48 hours.',
                },
            });
        }));
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
        this.placeFreeMealOrder = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const claimerUserId = req.user.userId;
            const { tokenId, providerId, foodId, quantity } = req.body;
            if (!tokenId || !providerId || !foodId) {
                throw new AppError_1.default('tokenId, providerId and foodId are required', 400, 'INVALID_INPUT');
            }
            const result = yield mealToken_service_1.default.placeFreeMealOrder(claimerUserId, {
                tokenId,
                providerId,
                foodId,
                quantity: quantity || 1,
            });
            res.status(201).json({
                success: true,
                message: 'Free meal order placed successfully!',
                data: {
                    orderId: result.order.orderId,
                    status: result.order.status,
                    moneyFlow: result.moneyFlow,
                },
            });
        }));
        /**
         * Admin: GET /api/v1/admin/donation/tokens
         */
        this.adminGetAllTokens = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const filters = {
                status: req.query.status,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
            };
            const result = yield mealToken_service_1.default.adminGetAllTokens(filters);
            res.status(200).json({
                success: true,
                data: result,
            });
        }));
    }
}
exports.default = new MealTokenController();
