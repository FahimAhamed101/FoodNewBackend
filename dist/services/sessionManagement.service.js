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
const mongoose_1 = require("mongoose");
const session_model_1 = require("../models/session.model");
const user_model_1 = require("../models/user.model");
const auditLog_model_1 = require("../models/auditLog.model");
const authUtils_1 = require("../utils/authUtils");
const AppError_1 = __importDefault(require("../utils/AppError"));
/**
 * Session Management Service
 *
 * Handles multi-device session management with:
 * - Refresh token rotation (prevents token reuse attacks)
 * - Per-device session tracking
 * - Granular revocation (single device or all devices)
 * - Stolen token detection
 * - Session limits per user
 */
class SessionManagementService {
    constructor() {
        this.MAX_SESSIONS_PER_USER = parseInt(process.env.MAX_SESSIONS_PER_USER || '5');
    }
    /**
     * Create a new session for a user
     *
     * @param userId - User ID
     * @param accessToken - Access token (will be hashed)
     * @param refreshToken - Refresh token (will be hashed)
     * @param deviceInfo - Device information
     * @param expiresAt - Session expiration date
     * @returns Created session
     */
    createSession(userId, accessToken, refreshToken, deviceInfo, expiresAt) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check session limit
            yield this.enforceSessionLimit(userId);
            // Generate token family for rotation tracking
            const tokenFamily = (0, authUtils_1.generateTokenFamily)();
            // Hash tokens before storing (defense in depth)
            const hashedAccessToken = (0, authUtils_1.hashToken)(accessToken);
            const hashedRefreshToken = (0, authUtils_1.hashToken)(refreshToken);
            // Create session
            const session = yield session_model_1.Session.create({
                userId: new mongoose_1.Types.ObjectId(userId),
                accessToken: hashedAccessToken,
                refreshToken: hashedRefreshToken,
                deviceId: deviceInfo.deviceId,
                deviceName: deviceInfo.deviceName,
                deviceType: deviceInfo.deviceType,
                userAgent: deviceInfo.userAgent,
                ipAddress: deviceInfo.ipAddress,
                country: deviceInfo.country,
                city: deviceInfo.city,
                tokenFamily,
                issuedAt: new Date(),
                expiresAt,
                lastActivityAt: new Date(),
            });
            // Log session creation
            yield this.logSessionEvent(userId, auditLog_model_1.AuditEventType.LOGIN_SUCCESS, deviceInfo, 'Session created successfully');
            return session;
        });
    }
    /**
     * Rotate refresh token (used when refreshing access token)
     *
     * Token rotation prevents stolen token reuse:
     * - Old refresh token is invalidated
     * - New refresh token is issued
     * - If old token is used again, we detect theft
     */
    rotateRefreshToken(oldRefreshToken, newAccessToken, newRefreshToken, deviceInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const hashedOldToken = (0, authUtils_1.hashToken)(oldRefreshToken);
            // Find existing session
            const existingSession = yield session_model_1.Session.findOne({
                refreshToken: hashedOldToken,
                isRevoked: false,
            });
            if (!existingSession) {
                // Token not found or already revoked
                // This could indicate token reuse attack!
                yield this.handleSuspiciousTokenReuse(oldRefreshToken, deviceInfo);
                throw new AppError_1.default('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
            }
            // Check if token is expired
            if (existingSession.expiresAt < new Date()) {
                throw new AppError_1.default('Refresh token expired', 401, 'TOKEN_EXPIRED');
            }
            // Revoke old session
            existingSession.isRevoked = true;
            existingSession.revokedAt = new Date();
            existingSession.revokedReason = 'token_rotation';
            yield existingSession.save();
            // Create new session with same token family
            const hashedNewAccessToken = (0, authUtils_1.hashToken)(newAccessToken);
            const hashedNewRefreshToken = (0, authUtils_1.hashToken)(newRefreshToken);
            const newSession = yield session_model_1.Session.create({
                userId: existingSession.userId,
                accessToken: hashedNewAccessToken,
                refreshToken: hashedNewRefreshToken,
                deviceId: existingSession.deviceId,
                deviceName: existingSession.deviceName,
                deviceType: existingSession.deviceType,
                userAgent: deviceInfo.userAgent,
                ipAddress: deviceInfo.ipAddress,
                country: deviceInfo.country,
                city: deviceInfo.city,
                tokenFamily: existingSession.tokenFamily, // Same family
                previousTokenId: existingSession._id, // Link to previous token
                issuedAt: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                lastActivityAt: new Date(),
            });
            // Log token refresh
            yield this.logSessionEvent(existingSession.userId.toString(), auditLog_model_1.AuditEventType.TOKEN_REFRESH, deviceInfo, 'Refresh token rotated successfully');
            return newSession;
        });
    }
    /**
     * Revoke a single session (single device logout)
     */
    revokeSession(sessionId_1) {
        return __awaiter(this, arguments, void 0, function* (sessionId, reason = 'user_logout') {
            const session = yield session_model_1.Session.findById(sessionId);
            if (!session) {
                throw new AppError_1.default('Session not found', 404, 'SESSION_NOT_FOUND');
            }
            session.isRevoked = true;
            session.revokedAt = new Date();
            session.revokedReason = reason;
            yield session.save();
            // Log revocation
            yield auditLog_model_1.AuditLog.create({
                eventType: auditLog_model_1.AuditEventType.TOKEN_REVOKED,
                userId: session.userId,
                action: `Session revoked: ${reason}`,
                result: 'success',
                deviceId: session.deviceId,
                ipAddress: session.ipAddress,
                riskLevel: auditLog_model_1.RiskLevel.LOW,
                timestamp: new Date(),
            });
        });
    }
    /**
     * Revoke all sessions for a user (global logout)
     */
    revokeAllSessions(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, reason = 'user_logout') {
            const result = yield session_model_1.Session.updateMany({ userId: new mongoose_1.Types.ObjectId(userId), isRevoked: false }, {
                $set: {
                    isRevoked: true,
                    revokedAt: new Date(),
                    revokedReason: reason,
                },
            });
            // Log global logout
            yield auditLog_model_1.AuditLog.create({
                eventType: auditLog_model_1.AuditEventType.LOGOUT,
                userId: new mongoose_1.Types.ObjectId(userId),
                action: `All sessions revoked: ${reason}`,
                result: 'success',
                riskLevel: auditLog_model_1.RiskLevel.LOW,
                timestamp: new Date(),
            });
            return result.modifiedCount;
        });
    }
    /**
     * Get all active sessions for a user
     */
    getUserSessions(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield session_model_1.Session.find({
                userId: new mongoose_1.Types.ObjectId(userId),
                isRevoked: false,
                expiresAt: { $gt: new Date() },
            }).sort({ lastActivityAt: -1 });
        });
    }
    /**
     * Verify if a session is valid
     */
    verifySession(accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const hashedToken = (0, authUtils_1.hashToken)(accessToken);
            const session = yield session_model_1.Session.findOne({
                accessToken: hashedToken,
                isRevoked: false,
                expiresAt: { $gt: new Date() },
            });
            if (session) {
                // Update last activity
                session.lastActivityAt = new Date();
                yield session.save();
            }
            return session;
        });
    }
    /**
     * Enforce session limit per user
     *
     * If user has too many sessions, revoke the oldest ones
     */
    enforceSessionLimit(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const activeSessions = yield session_model_1.Session.find({
                userId: new mongoose_1.Types.ObjectId(userId),
                isRevoked: false,
            }).sort({ lastActivityAt: 1 }); // Oldest first
            if (activeSessions.length >= this.MAX_SESSIONS_PER_USER) {
                // Revoke oldest sessions
                const sessionsToRevoke = activeSessions.slice(0, activeSessions.length - this.MAX_SESSIONS_PER_USER + 1);
                for (const session of sessionsToRevoke) {
                    yield this.revokeSession(session._id.toString(), 'session_limit_exceeded');
                }
            }
        });
    }
    /**
     * Handle suspicious token reuse (potential theft)
     *
     * If a revoked refresh token is used, it indicates:
     * 1. Token was stolen and attacker is trying to use it
     * 2. User is using an old token (unlikely with proper client implementation)
     *
     * Response: Revoke ALL tokens in the same token family
     */
    handleSuspiciousTokenReuse(token, deviceInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const hashedToken = (0, authUtils_1.hashToken)(token);
            // Find the revoked session
            const revokedSession = yield session_model_1.Session.findOne({
                refreshToken: hashedToken,
                isRevoked: true,
            });
            if (revokedSession) {
                // Revoke all sessions in the same token family
                yield session_model_1.Session.updateMany({ tokenFamily: revokedSession.tokenFamily }, {
                    $set: {
                        isRevoked: true,
                        revokedAt: new Date(),
                        revokedReason: 'token_reuse_detected',
                    },
                });
                // Log security incident
                yield auditLog_model_1.AuditLog.create({
                    eventType: auditLog_model_1.AuditEventType.TOKEN_REUSE_DETECTED,
                    userId: revokedSession.userId,
                    action: 'Suspicious token reuse detected - all sessions revoked',
                    result: 'success',
                    deviceId: deviceInfo.deviceId,
                    ipAddress: deviceInfo.ipAddress,
                    riskLevel: auditLog_model_1.RiskLevel.CRITICAL,
                    riskFactors: ['token_reuse', 'potential_theft'],
                    timestamp: new Date(),
                });
                // Notify user (email/SMS)
                const user = yield user_model_1.User.findById(revokedSession.userId);
                if (user) {
                    // TODO: Send security alert email
                    console.warn(`Security alert: Token reuse detected for user ${user.email}`);
                }
            }
        });
    }
    /**
     * Log session-related events
     */
    logSessionEvent(userId, eventType, deviceInfo, action) {
        return __awaiter(this, void 0, void 0, function* () {
            yield auditLog_model_1.AuditLog.create({
                eventType,
                userId: new mongoose_1.Types.ObjectId(userId),
                action,
                result: 'success',
                deviceId: deviceInfo.deviceId,
                ipAddress: deviceInfo.ipAddress,
                userAgent: deviceInfo.userAgent,
                country: deviceInfo.country,
                city: deviceInfo.city,
                riskLevel: auditLog_model_1.RiskLevel.LOW,
                timestamp: new Date(),
            });
        });
    }
}
exports.default = new SessionManagementService();
