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
const adminPayout_service_1 = __importDefault(require("../services/adminPayout.service"));
const AppError_1 = __importDefault(require("../utils/AppError"));
class AdminPayoutController {
    constructor() {
        /**
         * GET /api/v1/admin/payouts/pending
         * Get all providers with pending payouts
         */
        this.getPendingPayouts = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { minAmount, providerId, page, limit } = req.query;
            const result = yield adminPayout_service_1.default.getPendingPayouts({
                minAmount: minAmount ? parseFloat(minAmount) : undefined,
                providerId: providerId,
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
            });
            res.status(200).json({
                success: true,
                message: 'Pending payouts retrieved successfully',
                data: result,
            });
        }));
        /**
         * POST /api/v1/admin/payouts/process/:providerId
         * Process payout using Stripe Transfer
         */
        this.processStripePayout = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { providerId } = req.params;
            const adminId = req.user.userId;
            if (!providerId || Array.isArray(providerId)) {
                throw new AppError_1.default('Provider ID is required', 400, 'PROVIDER_ID_REQUIRED');
            }
            const result = yield adminPayout_service_1.default.processStripePayout(providerId, adminId);
            res.status(200).json({
                success: true,
                message: result.message,
                data: result.payout,
            });
        }));
        /**
         * POST /api/v1/admin/payouts/mark-settled/:providerId
         * Mark payout as settled manually (bank transfer, etc.)
         */
        this.markPayoutAsSettled = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { providerId } = req.params;
            const adminId = req.user.userId;
            const { reference, notes } = req.body;
            if (!providerId || Array.isArray(providerId)) {
                throw new AppError_1.default('Provider ID is required', 400, 'PROVIDER_ID_REQUIRED');
            }
            if (!reference) {
                throw new AppError_1.default('Payment reference is required', 400, 'REFERENCE_REQUIRED');
            }
            const result = yield adminPayout_service_1.default.markPayoutAsSettled(providerId, adminId, {
                reference,
                notes,
            });
            res.status(200).json({
                success: true,
                message: result.message,
                data: result.payout,
            });
        }));
        /**
         * GET /api/v1/admin/payouts/history
         * Get payout history
         */
        this.getPayoutHistory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { providerId, startDate, endDate, page, limit } = req.query;
            const result = yield adminPayout_service_1.default.getPayoutHistory({
                providerId: providerId,
                startDate: startDate,
                endDate: endDate,
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
            });
            res.status(200).json({
                success: true,
                message: 'Payout history retrieved successfully',
                data: result,
            });
        }));
        /**
         * GET /api/v1/admin/payouts/provider/:providerId
         * Get provider payout details
         */
        this.getProviderPayoutDetails = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { providerId } = req.params;
            if (!providerId || Array.isArray(providerId)) {
                throw new AppError_1.default('Provider ID is required', 400, 'PROVIDER_ID_REQUIRED');
            }
            const result = yield adminPayout_service_1.default.getProviderPayoutDetails(providerId);
            res.status(200).json({
                success: true,
                message: 'Provider payout details retrieved successfully',
                data: result,
            });
        }));
    }
}
exports.default = new AdminPayoutController();
