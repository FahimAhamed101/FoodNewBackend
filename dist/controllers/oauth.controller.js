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
const oauth_service_1 = __importDefault(require("../services/oauth.service"));
const sessionManagement_service_1 = __importDefault(require("../services/sessionManagement.service"));
const catchAsync_1 = require("../utils/catchAsync");
const user_model_1 = require("../models/user.model");
const authUtils_1 = require("../utils/authUtils");
const AppError_1 = __importDefault(require("../utils/AppError"));
/**
 * OAuth Controller
 *
 * Handles Google OAuth authentication endpoints
 */
class OAuthController {
    constructor() {
        /**
         * POST /auth/google
         *
         * Authenticate user with Google idToken
         *
         * Request body:
         * - idToken: Google idToken from frontend
         * - requestedRole: USER or PROVIDER
         *
         * Response:
         * - If step-up required: { requiresStepUp: true, user: {...} }
         * - If successful: { user: {...}, session: { accessToken, refreshToken } }
         */
        this.googleAuth = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { idToken, requestedRole } = req.body;
            // Validation
            if (!idToken) {
                throw new AppError_1.default('Google idToken is required', 400, 'MISSING_ID_TOKEN');
            }
            if (!requestedRole) {
                throw new AppError_1.default('Requested role is required', 400, 'MISSING_ROLE');
            }
            // Validate role
            if (!Object.values(user_model_1.UserRole).includes(requestedRole)) {
                throw new AppError_1.default('Invalid role', 400, 'INVALID_ROLE');
            }
            // Extract device information
            const userAgent = req.headers['user-agent'] || '';
            const ipAddress = ((_a = req.headers['x-forwarded-for']) === null || _a === void 0 ? void 0 : _a.split(',')[0]) ||
                req.socket.remoteAddress || '';
            const { deviceName, deviceType } = (0, authUtils_1.parseDeviceInfo)(userAgent);
            const deviceInfo = {
                userAgent,
                ipAddress,
                deviceName,
                deviceType,
                // TODO: Add geo-location (country, city) using IP geolocation service
            };
            // Authenticate with Google
            const result = yield oauth_service_1.default.authenticateWithGoogle(idToken, requestedRole, deviceInfo);
            // Return response
            if (result.requiresStepUp) {
                res.status(200).json({
                    success: true,
                    requiresStepUp: true,
                    message: result.message,
                    data: {
                        user: result.user,
                    },
                });
            }
            else {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: {
                        user: result.user,
                        session: result.session,
                    },
                });
            }
        }));
        /**
         * POST /auth/google/verify-stepup
         *
         * Verify step-up OTP for PROVIDER access
         *
         * Request body:
         * - email: User's email
         * - otp: 6-digit OTP
         */
        this.verifyStepUp = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { email, otp } = req.body;
            if (!email || !otp) {
                throw new AppError_1.default('Email and OTP are required', 400, 'MISSING_FIELDS');
            }
            // Extract device information
            const userAgent = req.headers['user-agent'] || '';
            const ipAddress = ((_a = req.headers['x-forwarded-for']) === null || _a === void 0 ? void 0 : _a.split(',')[0]) ||
                req.socket.remoteAddress || '';
            const { deviceName, deviceType } = (0, authUtils_1.parseDeviceInfo)(userAgent);
            const deviceInfo = {
                userAgent,
                ipAddress,
                deviceName,
                deviceType,
            };
            // Verify OTP
            const result = yield oauth_service_1.default.verifyStepUpOtp(email, otp, deviceInfo);
            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    user: result.user,
                    session: result.session,
                },
            });
        }));
        /**
         * POST /auth/refresh
         *
         * Refresh access token using refresh token
         *
         * Request body:
         * - refreshToken: Refresh token
         */
        this.refreshToken = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { refreshToken } = req.body;
            if (!refreshToken) {
                throw new AppError_1.default('Refresh token is required', 400, 'MISSING_REFRESH_TOKEN');
            }
            // Extract device information
            const userAgent = req.headers['user-agent'] || '';
            const ipAddress = ((_a = req.headers['x-forwarded-for']) === null || _a === void 0 ? void 0 : _a.split(',')[0]) ||
                req.socket.remoteAddress || '';
            const { deviceName, deviceType } = (0, authUtils_1.parseDeviceInfo)(userAgent);
            const deviceInfo = {
                userAgent,
                ipAddress,
                deviceName,
                deviceType,
            };
            // TODO: Implement token refresh logic
            // This should:
            // 1. Verify refresh token
            // 2. Generate new access token
            // 3. Rotate refresh token
            // 4. Update session
            throw new AppError_1.default('Token refresh not yet implemented', 501);
        }));
        /**
         * GET /auth/sessions
         *
         * Get all active sessions for the authenticated user
         */
        this.getSessions = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                throw new AppError_1.default('Authentication required', 401);
            }
            const sessions = yield sessionManagement_service_1.default.getUserSessions(userId);
            res.status(200).json({
                success: true,
                data: {
                    sessions: sessions.map(session => ({
                        id: session._id,
                        deviceName: session.deviceName,
                        deviceType: session.deviceType,
                        ipAddress: session.ipAddress,
                        country: session.country,
                        city: session.city,
                        lastActivityAt: session.lastActivityAt,
                        createdAt: session.createdAt,
                    })),
                },
            });
        }));
        /**
         * DELETE /auth/sessions/:sessionId
         *
         * Revoke a specific session (logout from specific device)
         */
        this.revokeSession = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { sessionId } = req.params;
            if (!userId) {
                throw new AppError_1.default('Authentication required', 401);
            }
            yield sessionManagement_service_1.default.revokeSession(sessionId, 'user_logout');
            res.status(200).json({
                success: true,
                message: 'Session revoked successfully',
            });
        }));
        /**
         * DELETE /auth/sessions
         *
         * Revoke all sessions (logout from all devices)
         */
        this.revokeAllSessions = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                throw new AppError_1.default('Authentication required', 401);
            }
            const count = yield sessionManagement_service_1.default.revokeAllSessions(userId, 'user_logout');
            res.status(200).json({
                success: true,
                message: `${count} session(s) revoked successfully`,
            });
        }));
    }
}
exports.default = new OAuthController();
