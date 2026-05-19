"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middlewares/authenticate");
const mealToken_controller_1 = __importDefault(require("../controllers/mealToken.controller"));
const router = (0, express_1.Router)();
// ─── Public ──────────────────────────────────────────────────────────────────
// How many free meals are available (used by feed tab indicator)
router.get('/available-count', mealToken_controller_1.default.getAvailableCount);
// ─── Authenticated (any logged-in user) ──────────────────────────────────────
router.use(authenticate_1.authenticate);
// Price breakdown before paying
router.get('/breakdown', mealToken_controller_1.default.getBreakdown);
// Create Stripe payment intent for donation
router.post('/create-payment-intent', mealToken_controller_1.default.createDonationPaymentIntent);
// Confirm payment after Stripe succeeds (frontend calls this)
router.post('/confirm-payment', mealToken_controller_1.default.confirmDonationPayment);
// Donor sees their own tokens
router.get('/my-tokens', mealToken_controller_1.default.getMyTokens);
// User's remaining daily free meal quota
router.get('/daily-quota', mealToken_controller_1.default.getDailyQuota);
// Claim a free meal token
router.post('/claim/:tokenId', mealToken_controller_1.default.claimFreeMeal);
// Place free meal order using a claimed token
// Body: { tokenId, providerId, foodId, quantity }
router.post('/place-free-order', mealToken_controller_1.default.placeFreeMealOrder);
exports.default = router;
