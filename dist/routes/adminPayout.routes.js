"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const user_model_1 = require("../models/user.model");
const adminPayout_controller_1 = __importDefault(require("../controllers/adminPayout.controller"));
const router = (0, express_1.Router)();
// All routes require admin authentication
router.use(authenticate_1.authenticate);
router.use((0, requireRole_1.requireRole)([user_model_1.UserRole.ADMIN]));
/**
 * GET /api/v1/admin/payouts/pending
 * Get all providers with pending payouts
 * Query params: ?minAmount=50&providerId=xxx&page=1&limit=20
 */
router.get('/pending', adminPayout_controller_1.default.getPendingPayouts);
/**
 * GET /api/v1/admin/payouts/history
 * Get payout history
 * Query params: ?providerId=xxx&startDate=2024-01-01&endDate=2024-12-31&page=1&limit=20
 */
router.get('/history', adminPayout_controller_1.default.getPayoutHistory);
/**
 * GET /api/v1/admin/payouts/provider/:providerId
 * Get provider payout details
 */
router.get('/provider/:providerId', adminPayout_controller_1.default.getProviderPayoutDetails);
/**
 * POST /api/v1/admin/payouts/process/:providerId
 * Process payout using Stripe Transfer
 * Requires provider to have Stripe Connected Account
 */
router.post('/process/:providerId', adminPayout_controller_1.default.processStripePayout);
/**
 * POST /api/v1/admin/payouts/mark-settled/:providerId
 * Mark payout as settled manually (for bank transfers, cash, etc.)
 * Body: { reference: "BANK_REF_123", notes: "Paid via bank transfer" }
 */
router.post('/mark-settled/:providerId', adminPayout_controller_1.default.markPayoutAsSettled);
exports.default = router;
