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
const google_auth_library_1 = require("google-auth-library");
const AppError_1 = __importDefault(require("../utils/AppError"));
/**
 * Google OAuth 2.0 Service
 *
 * Handles secure verification of Google idTokens using Google's official SDK.
 * This is the FIRST line of defense - we NEVER trust frontend tokens blindly.
 *
 * Security Guarantees:
 * 1. Verifies token signature using Google's public keys (RS256)
 * 2. Validates audience (aud) matches our Google Client ID
 * 3. Validates issuer (iss) is Google
 * 4. Validates expiration (exp)
 * 5. Ensures email is verified by Google
 */
class GoogleAuthService {
    constructor() {
        this.client = null;
        this.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
        // Support multiple audiences (e.g. Android/iOS/Web) via comma-separated list
        const additionalAudiences = process.env.GOOGLE_ADDITIONAL_AUDIENCES
            ? process.env.GOOGLE_ADDITIONAL_AUDIENCES.split(',').map(aud => aud.trim())
            : [];
        this.GOOGLE_AUDIENCES = [this.GOOGLE_CLIENT_ID, ...additionalAudiences].filter(Boolean);
        this.isConfigured = this.GOOGLE_AUDIENCES.length > 0;
        if (this.isConfigured) {
            this.client = new google_auth_library_1.OAuth2Client(this.GOOGLE_CLIENT_ID);
            console.log(`✅ Google OAuth service initialized with ${this.GOOGLE_AUDIENCES.length} allowed audience(s)`);
        }
        else {
            console.warn('⚠️  Google OAuth not configured. Set GOOGLE_CLIENT_ID in .env to enable.');
        }
    }
    /**
     * Check if Google OAuth is configured
     */
    ensureConfigured() {
        if (!this.isConfigured || !this.client) {
            throw new AppError_1.default('Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in environment variables.', 500, 'GOOGLE_OAUTH_NOT_CONFIGURED');
        }
    }
    /**
     * Verify Google idToken and extract user information
     *
     * @param idToken - The Google idToken from frontend
     * @returns Verified user data from Google
     * @throws AppError if token is invalid or verification fails
     */
    verifyIdToken(idToken) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            this.ensureConfigured();
            try {
                // Step 1: Verify token with Google's servers
                const ticket = yield this.client.verifyIdToken({
                    idToken,
                    audience: this.GOOGLE_AUDIENCES,
                });
                // Step 2: Extract payload
                const payload = ticket.getPayload();
                if (!payload) {
                    throw new AppError_1.default('Invalid token payload', 401, 'INVALID_TOKEN');
                }
                // Step 3: Validate critical fields
                this.validatePayload(payload);
                // Step 4: Extract and return user data
                return this.extractUserData(payload);
            }
            catch (error) {
                // Handle specific Google Auth errors
                if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('Token used too late')) {
                    throw new AppError_1.default('Google token has expired', 401, 'TOKEN_EXPIRED');
                }
                if ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('Invalid token signature')) {
                    throw new AppError_1.default('Invalid Google token signature', 401, 'INVALID_SIGNATURE');
                }
                if ((_c = error.message) === null || _c === void 0 ? void 0 : _c.includes('Wrong recipient')) {
                    // The error message usually contains the received audience
                    throw new AppError_1.default(`Google Token Audience Mismatch. Received: ${(_d = error.message.split('!').pop()) === null || _d === void 0 ? void 0 : _d.trim()}. Ensure GOOGLE_CLIENT_ID in backend matches the one sent by frontend.`, 401, 'AUDIENCE_MISMATCH');
                }
                // Re-throw AppError as-is
                if (error instanceof AppError_1.default) {
                    throw error;
                }
                // Generic error
                throw new AppError_1.default('Failed to verify Google token', 401, 'GOOGLE_VERIFICATION_FAILED');
            }
        });
    }
    validatePayload(payload) {
        // Check 1: Email must be verified
        if (!payload.email_verified) {
            throw new AppError_1.default('Email not verified by Google. Please verify your email with Google first.', 403, 'EMAIL_NOT_VERIFIED');
        }
        // Check 2: Validate audience (already done by verifyIdToken, but double-check)
        if (!this.GOOGLE_AUDIENCES.includes(payload.aud)) {
            console.error(`❌ Google Audience Mismatch: Received ${payload.aud}, Expected one of: ${this.GOOGLE_AUDIENCES.join(', ')}`);
            throw new AppError_1.default(`Token audience mismatch. Received: ${payload.aud}. Please check your GOOGLE_CLIENT_ID configuration.`, 401, 'AUDIENCE_MISMATCH');
        }
        // Check 3: Validate issuer
        const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
        if (!payload.iss || !validIssuers.includes(payload.iss)) {
            throw new AppError_1.default('Invalid token issuer', 401, 'INVALID_ISSUER');
        }
        // Check 4: Ensure required fields exist
        if (!payload.sub || !payload.email) {
            throw new AppError_1.default('Missing required fields in token', 401, 'MISSING_FIELDS');
        }
    }
    /**
     * Extract user data from verified token payload
     *
     * Why 'sub' is the primary identifier:
     * - 'sub' (Subject) is Google's unique, immutable user identifier
     * - Email can change, but 'sub' NEVER changes
     * - Use 'sub' as the foreign key to link Google identity to User model
     */
    extractUserData(payload) {
        return {
            googleId: payload.sub, // Primary identifier - NEVER changes
            email: payload.email,
            emailVerified: payload.email_verified || false,
            name: payload.name || '',
            givenName: payload.given_name || '',
            familyName: payload.family_name || '',
            picture: payload.picture || '',
            locale: payload.locale || 'en',
        };
    }
    /**
     * Validate that the Google Client ID is properly configured
     */
    checkConfiguration() {
        return this.isConfigured;
    }
}
exports.default = new GoogleAuthService();
