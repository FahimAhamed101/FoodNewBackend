import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { UserRole } from '../models/user.model';
import adminPayoutController from '../controllers/adminPayout.controller';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireRole([UserRole.ADMIN]));

/**
 * GET /api/v1/admin/payouts/pending
 * Get all providers with pending payouts
 * Query params: ?minAmount=50&providerId=xxx&page=1&limit=20
 */
router.get('/pending', adminPayoutController.getPendingPayouts);

/**
 * GET /api/v1/admin/payouts/history
 * Get payout history
 * Query params: ?providerId=xxx&startDate=2024-01-01&endDate=2024-12-31&page=1&limit=20
 */
router.get('/history', adminPayoutController.getPayoutHistory);

/**
 * GET /api/v1/admin/payouts/provider/:providerId
 * Get provider payout details
 */
router.get('/provider/:providerId', adminPayoutController.getProviderPayoutDetails);

/**
 * POST /api/v1/admin/payouts/process/:providerId
 * Process payout using Stripe Transfer
 * Requires provider to have Stripe Connected Account
 */
router.post('/process/:providerId', adminPayoutController.processStripePayout);

/**
 * POST /api/v1/admin/payouts/mark-settled/:providerId
 * Mark payout as settled manually (for bank transfers, cash, etc.)
 * Body: { reference: "BANK_REF_123", notes: "Paid via bank transfer" }
 */
router.post('/mark-settled/:providerId', adminPayoutController.markPayoutAsSettled);

export default router;
