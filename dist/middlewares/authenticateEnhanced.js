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
exports.optionalAuth = exports.authenticateEnhanced = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const user_model_1 = require("../models/user.model");
const blacklistedToken_model_1 = require("../models/blacklistedToken.model");
const sessionManagement_service_1 = __importDefault(require("../services/sessionManagement.service"));
const auditLog_model_1 = require("../models/auditLog.model");
/**
 * Enhanced Authentication Middleware
 *
 * This middleware:
 * 1. Extracts JWT from Authorization header
 * 2. Verifies JWT signature and expiration
 * 3. Checks if token is blacklisted
 * 4. Verifies session exists and is active
 * 5. Checks if user exists and is active
 * 6. Updates session last activity
 * 7. Attaches user info to request
 */
const authenticateEnhanced = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Step 1: Extract token from Authorization header
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return next(new AppError_1.default('You are not logged in! Please log in to get access.', 401, 'AUTH_ERROR'));
        }
        // Step 2: Check if token is blacklisted (legacy support)
        const isBlacklisted = yield blacklistedToken_model_1.BlacklistedToken.findOne({ token });
        if (isBlacklisted) {
            return next(new AppError_1.default('This token is no longer valid. Please log in again.', 401, 'AUTH_ERROR'));
        }
        // Step 3: Verify JWT signature and expiration
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'super-secret-key');
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                return next(new AppError_1.default('Your token has expired. Please log in again.', 401, 'TOKEN_EXPIRED'));
            }
            return next(new AppError_1.default('Invalid token. Please log in again!', 401, 'AUTH_ERROR'));
        }
        // Step 4: Verify session exists and is active
        const session = yield sessionManagement_service_1.default.verifySession(token);
        if (!session) {
            // Session not found or revoked
            yield logSuspiciousActivity(decoded.userId, 'Session not found for valid JWT', req);
            return next(new AppError_1.default('Session expired or revoked. Please log in again.', 401, 'SESSION_INVALID'));
        }
        // Step 5: Check if user exists and is active
        const user = yield user_model_1.User.findById(decoded.userId);
        if (!user) {
            return next(new AppError_1.default('The user belonging to this token no longer exists.', 401, 'AUTH_ERROR'));
        }
        if (!user.isActive) {
            return next(new AppError_1.default('Your account has been deactivated. Please contact support.', 403, 'ACCOUNT_INACTIVE'));
        }
        if (user.isSuspended) {
            return next(new AppError_1.default(`Your account has been suspended. Reason: ${user.suspendedReason || 'Contact support'}`, 403, 'ACCOUNT_SUSPENDED'));
        }
        // Step 6: Verify role matches (defense against role tampering)
        if (user.role !== decoded.role) {
            yield logSuspiciousActivity(decoded.userId, `Role mismatch: JWT has ${decoded.role}, DB has ${user.role}`, req);
            return next(new AppError_1.default('Invalid token. Please log in again!', 401, 'ROLE_MISMATCH'));
        }
        // Step 7: Attach user info to request
        req.token = token;
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
        };
        next();
    }
    catch (err) {
        next(new AppError_1.default('Authentication failed. Please log in again!', 401, 'AUTH_ERROR'));
    }
});
exports.authenticateEnhanced = authenticateEnhanced;
/**
 * Log suspicious authentication activity
 */
function logSuspiciousActivity(userId, reason, req) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const ipAddress = ((_a = req.headers['x-forwarded-for']) === null || _a === void 0 ? void 0 : _a.split(',')[0]) ||
            req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';
        yield auditLog_model_1.AuditLog.create({
            eventType: auditLog_model_1.AuditEventType.SUSPICIOUS_LOGIN,
            userId,
            action: `Suspicious authentication activity: ${reason}`,
            result: 'failure',
            ipAddress,
            userAgent,
            riskLevel: auditLog_model_1.RiskLevel.HIGH,
            riskFactors: ['suspicious_activity', 'potential_token_tampering'],
            timestamp: new Date(),
        });
    });
}
/**
 * Optional authentication middleware
 *
 * Attaches user info if token is present, but doesn't fail if missing
 */
const optionalAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return next(); // No token, continue without user info
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'super-secret-key');
        // Attach user info
        req.token = token;
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
        };
        next();
    }
    catch (err) {
        // Token invalid, continue without user info
        next();
    }
});
exports.optionalAuth = optionalAuth;
