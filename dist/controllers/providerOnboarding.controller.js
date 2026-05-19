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
exports.getOnboardingStatus = exports.verifyProvider = exports.getProviderVerificationDetails = exports.getPendingProviders = exports.uploadDocuments = exports.submitRestaurantInfo = exports.setPassword = exports.verifyEmailOtp = exports.registerEmail = void 0;
const providerOnboarding_service_1 = __importDefault(require("../services/providerOnboarding.service"));
const catchAsync_1 = require("../utils/catchAsync");
// ──────────────────────────────────────────────────────────
// STEP 1: Register Email & Send OTP
// POST /api/v1/auth/provider/register-email
// ──────────────────────────────────────────────────────────
exports.registerEmail = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    const result = yield providerOnboarding_service_1.default.registerEmail(email);
    res.status(200).json(Object.assign({ success: true }, result));
}));
// ──────────────────────────────────────────────────────────
// STEP 2: Verify Email OTP
// POST /api/v1/auth/provider/verify-email-otp
// ──────────────────────────────────────────────────────────
exports.verifyEmailOtp = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }
    const result = yield providerOnboarding_service_1.default.verifyEmailOtp(email, otp);
    res.status(200).json(Object.assign({ success: true }, result));
}));
// ──────────────────────────────────────────────────────────
// STEP 3: Set Password
// POST /api/v1/auth/provider/set-password
// ──────────────────────────────────────────────────────────
exports.setPassword = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { password, confirmPassword } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!password || !confirmPassword) {
        return res.status(400).json({ success: false, message: 'Password and confirmPassword are required' });
    }
    // Strong password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters, with uppercase, lowercase, number, and special character',
        });
    }
    const result = yield providerOnboarding_service_1.default.setPassword(userId, password, confirmPassword);
    res.status(200).json(Object.assign({ success: true }, result));
}));
// ──────────────────────────────────────────────────────────
// STEP 4: Submit Restaurant Information
// POST /api/v1/provider/onboarding/restaurant-info
// ──────────────────────────────────────────────────────────
exports.submitRestaurantInfo = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const providerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!providerId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const restaurantImageUrl = req.file ? req.file.path : undefined;
    const result = yield providerOnboarding_service_1.default.submitRestaurantInfo(providerId, req.body, restaurantImageUrl);
    res.status(200).json(Object.assign({ success: true }, result));
}));
// ──────────────────────────────────────────────────────────
// STEP 5: Upload Required Documents
// POST /api/v1/provider/onboarding/documents
// ──────────────────────────────────────────────────────────
exports.uploadDocuments = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const providerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!providerId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const files = req.files;
    const result = yield providerOnboarding_service_1.default.uploadDocuments(providerId, req.body, files || {});
    res.status(200).json(Object.assign({ success: true }, result));
}));
// ──────────────────────────────────────────────────────────
// STEP 6A: Admin - Get Pending Providers
// GET /api/v1/admin/providers/pending
// ──────────────────────────────────────────────────────────
exports.getPendingProviders = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield providerOnboarding_service_1.default.getPendingProviders(req.query);
    res.status(200).json({ success: true, data: result });
}));
// ──────────────────────────────────────────────────────────
// STEP 6B: Admin - Get Provider Verification Details
// GET /api/v1/admin/providers/:providerId/verification-details
// ──────────────────────────────────────────────────────────
exports.getProviderVerificationDetails = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const providerId = req.params.providerId;
    const result = yield providerOnboarding_service_1.default.getProviderVerificationDetails(providerId);
    res.status(200).json({ success: true, data: result });
}));
// ──────────────────────────────────────────────────────────
// STEP 6C/D: Admin - Approve or Reject Provider
// PATCH /api/v1/admin/providers/:providerId/verify
// ──────────────────────────────────────────────────────────
exports.verifyProvider = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const providerId = req.params.providerId;
    const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const { action, rejectionReason, adminNotes } = req.body;
    if (!adminId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!action) {
        return res.status(400).json({ success: false, message: 'Action is required (approve or reject)' });
    }
    const result = yield providerOnboarding_service_1.default.verifyProvider(providerId, adminId, action, rejectionReason, adminNotes);
    res.status(200).json(Object.assign({ success: true }, result));
}));
// ──────────────────────────────────────────────────────────
// STEP 7: Get Onboarding Status
// GET /api/v1/provider/onboarding/status
// ──────────────────────────────────────────────────────────
exports.getOnboardingStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const providerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!providerId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const result = yield providerOnboarding_service_1.default.getOnboardingStatus(providerId);
    res.status(200).json({ success: true, data: result });
}));
