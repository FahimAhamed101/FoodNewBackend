"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const upload_1 = require("../middlewares/upload");
const user_model_1 = require("../models/user.model");
const providerOnboarding_controller_1 = require("../controllers/providerOnboarding.controller");
const router = express_1.default.Router();
// ═══════════════════════════════════════════════════════════
// PUBLIC ROUTES (No auth required)
// ═══════════════════════════════════════════════════════════
// Step 1: Register Email & Send OTP
router.post('/auth/provider/register-email', providerOnboarding_controller_1.registerEmail);
// Step 2: Verify Email OTP
router.post('/auth/provider/verify-email-otp', providerOnboarding_controller_1.verifyEmailOtp);
// ═══════════════════════════════════════════════════════════
// PROVIDER ROUTES (Auth required)
// ═══════════════════════════════════════════════════════════
// Step 3: Set Password (needs temp token from Step 2)
router.post('/auth/provider/set-password', authenticate_1.authenticate, providerOnboarding_controller_1.setPassword);
// Step 4: Submit Restaurant Info  (with image upload)
router.post('/provider/onboarding/restaurant-info', authenticate_1.authenticate, (0, requireRole_1.requireRole)([user_model_1.UserRole.PROVIDER]), upload_1.upload.single('restturanImage'), providerOnboarding_controller_1.submitRestaurantInfo);
// Step 5: Upload Required Documents (multiple files)
router.post('/provider/onboarding/documents', authenticate_1.authenticate, (0, requireRole_1.requireRole)([user_model_1.UserRole.PROVIDER]), upload_1.upload.fields([
    { name: 'businessLicenseFile', maxCount: 1 },
    { name: 'healthPermitFile', maxCount: 1 },
    { name: 'stateOrCityLicenseFile', maxCount: 1 },
    { name: 'proofOfAddressFile', maxCount: 1 },
    { name: 'ownerGovernmentID', maxCount: 1 },
]), providerOnboarding_controller_1.uploadDocuments);
// Step 7: Check Onboarding Status
router.get('/provider/onboarding/status', authenticate_1.authenticate, (0, requireRole_1.requireRole)([user_model_1.UserRole.PROVIDER]), providerOnboarding_controller_1.getOnboardingStatus);
// ═══════════════════════════════════════════════════════════
// ADMIN ROUTES (Admin auth required)
// ═══════════════════════════════════════════════════════════
// Step 6A: Get pending providers list
router.get('/admin/providers/pending', authenticate_1.authenticate, (0, requireRole_1.requireRole)([user_model_1.UserRole.ADMIN]), providerOnboarding_controller_1.getPendingProviders);
// Step 6B: Get provider verification details
router.get('/admin/providers/:providerId/verification-details', authenticate_1.authenticate, (0, requireRole_1.requireRole)([user_model_1.UserRole.ADMIN]), providerOnboarding_controller_1.getProviderVerificationDetails);
// Step 6C/D: Approve or Reject provider
router.patch('/admin/providers/:providerId/verify', authenticate_1.authenticate, (0, requireRole_1.requireRole)([user_model_1.UserRole.ADMIN]), providerOnboarding_controller_1.verifyProvider);
exports.default = router;
