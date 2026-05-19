import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { UserRole } from '../models/user.model';
import mealTokenController from '../controllers/mealToken.controller';

const router = Router();

// ─── Public ──────────────────────────────────────────────────────────────────
// How many free meals are available (used by feed tab indicator)
router.get('/available-count', mealTokenController.getAvailableCount);

// ─── Authenticated (any logged-in user) ──────────────────────────────────────
router.use(authenticate);

// Price breakdown before paying
router.get('/breakdown', mealTokenController.getBreakdown);

// Create Stripe payment intent for donation
router.post('/create-payment-intent', mealTokenController.createDonationPaymentIntent);

// Confirm payment after Stripe succeeds (frontend calls this)
router.post('/confirm-payment', mealTokenController.confirmDonationPayment);

// Donor sees their own tokens
router.get('/my-tokens', mealTokenController.getMyTokens);

// User's remaining daily free meal quota
router.get('/daily-quota', mealTokenController.getDailyQuota);

// Claim a free meal token
router.post('/claim/:tokenId', mealTokenController.claimFreeMeal);

// Place free meal order using a claimed token
// Body: { tokenId, providerId, foodId, quantity }
router.post('/place-free-order', mealTokenController.placeFreeMealOrder);

export default router;
