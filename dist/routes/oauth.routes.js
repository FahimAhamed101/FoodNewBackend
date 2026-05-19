"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const oauth_controller_1 = __importDefault(require("../controllers/oauth.controller"));
const authenticate_1 = require("../middlewares/authenticate");
const validate_1 = require("../middlewares/validate");
const oauth_validation_1 = require("../validations/oauth.validation");
const router = (0, express_1.Router)();
/**
 * Public Routes (No authentication required)
 */
// Google OAuth authentication
router.post('/google', (0, validate_1.validate)(oauth_validation_1.googleAuthValidation), oauth_controller_1.default.googleAuth);
// Verify step-up OTP
router.post('/google/verify-stepup', (0, validate_1.validate)(oauth_validation_1.stepUpValidation), oauth_controller_1.default.verifyStepUp);
// Refresh access token
router.post('/refresh', (0, validate_1.validate)(oauth_validation_1.refreshTokenValidation), oauth_controller_1.default.refreshToken);
/**
 * Protected Routes (Authentication required)
 */
// Get all active sessions
router.get('/sessions', authenticate_1.authenticate, oauth_controller_1.default.getSessions);
// Revoke specific session
router.delete('/sessions/:sessionId', authenticate_1.authenticate, oauth_controller_1.default.revokeSession);
// Revoke all sessions (global logout)
router.delete('/sessions', authenticate_1.authenticate, oauth_controller_1.default.revokeAllSessions);
exports.default = router;
