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
exports.parseDeviceInfo = exports.generateDeviceId = exports.generateTokenFamily = exports.hashToken = exports.compareOtp = exports.hashOtp = exports.generateOtp = exports.comparePassword = exports.hashPassword = exports.verifyRefreshToken = exports.verifyToken = exports.generateRefreshToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate short-lived access token (15 minutes)
 *
 * JWT Payload Design:
 * - userId: User's database ID
 * - role: User's role (CUSTOMER, PROVIDER, ADMIN)
 * - iat: Issued at timestamp (automatic)
 * - exp: Expiration timestamp (automatic)
 *
 * What NOT to include:
 * - Sensitive data (passwords, SSN, etc.)
 * - Large objects (user profile, preferences)
 * - Mutable data that changes frequently
 */
const generateToken = (payload) => {
    const secret = process.env.JWT_SECRET || 'super-secret-key';
    const expiresIn = process.env.JWT_EXPIRE || '12h';
    const options = {
        expiresIn: expiresIn, // Increased to 12h for better UX
    };
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.generateToken = generateToken;
/**
 * Generate long-lived refresh token (7 days)
 *
 * Refresh tokens are used to obtain new access tokens without re-authentication.
 * They are stored in the database and can be revoked.
 */
const generateRefreshToken = (payload) => {
    const secret = process.env.JWT_REFRESH_SECRET || 'super-refresh-secret-key';
    const expiresIn = process.env.JWT_REFRESH_EXPIRE || '7d';
    const options = {
        expiresIn: expiresIn,
    };
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Verify access token
 */
const verifyToken = (token) => {
    const secret = process.env.JWT_SECRET || 'super-secret-key';
    return jsonwebtoken_1.default.verify(token, secret);
};
exports.verifyToken = verifyToken;
/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
    const secret = process.env.JWT_REFRESH_SECRET || 'super-refresh-secret-key';
    return jsonwebtoken_1.default.verify(token, secret);
};
exports.verifyRefreshToken = verifyRefreshToken;
/**
 * Hash password using bcrypt (12 rounds)
 */
const hashPassword = (password) => __awaiter(void 0, void 0, void 0, function* () {
    return yield bcrypt_1.default.hash(password, 12);
});
exports.hashPassword = hashPassword;
/**
 * Compare password with hash
 */
const comparePassword = (password, hash) => __awaiter(void 0, void 0, void 0, function* () {
    return yield bcrypt_1.default.compare(password, hash);
});
exports.comparePassword = comparePassword;
/**
 * Generate 6-digit OTP
 */
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateOtp = generateOtp;
/**
 * Hash OTP using SHA-256
 */
const hashOtp = (otp) => {
    return crypto_1.default.createHash('sha256').update(otp).digest('hex');
};
exports.hashOtp = hashOtp;
/**
 * Compare OTP with hash
 */
const compareOtp = (otp, hashedOtp) => {
    const hash = crypto_1.default.createHash('sha256').update(otp).digest('hex');
    return hash === hashedOtp;
};
exports.compareOtp = compareOtp;
/**
 * Hash token for storage (SHA-256)
 *
 * Why hash tokens?
 * - Defense in depth: Even if database is compromised, tokens are useless
 * - Prevents token theft from database backups
 */
const hashToken = (token) => {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
};
exports.hashToken = hashToken;
/**
 * Generate unique token family ID for refresh token rotation
 */
const generateTokenFamily = () => {
    return crypto_1.default.randomUUID();
};
exports.generateTokenFamily = generateTokenFamily;
/**
 * Generate unique device ID
 */
const generateDeviceId = (userAgent, ipAddress) => {
    const data = `${userAgent}-${ipAddress}-${Date.now()}`;
    return crypto_1.default.createHash('sha256').update(data).digest('hex').substring(0, 32);
};
exports.generateDeviceId = generateDeviceId;
/**
 * Parse device information from user agent
 */
const parseDeviceInfo = (userAgent) => {
    const ua = userAgent.toLowerCase();
    // Detect device type
    let deviceType = 'web';
    if (ua.includes('mobile')) {
        deviceType = 'mobile';
    }
    else if (ua.includes('tablet') || ua.includes('ipad')) {
        deviceType = 'tablet';
    }
    else if (ua.includes('electron')) {
        deviceType = 'desktop';
    }
    // Detect browser/device name
    let deviceName = 'Unknown Device';
    if (ua.includes('chrome'))
        deviceName = 'Chrome';
    else if (ua.includes('firefox'))
        deviceName = 'Firefox';
    else if (ua.includes('safari'))
        deviceName = 'Safari';
    else if (ua.includes('edge'))
        deviceName = 'Edge';
    // Add OS info
    if (ua.includes('windows'))
        deviceName += ' on Windows';
    else if (ua.includes('mac'))
        deviceName += ' on Mac';
    else if (ua.includes('linux'))
        deviceName += ' on Linux';
    else if (ua.includes('android'))
        deviceName += ' on Android';
    else if (ua.includes('ios') || ua.includes('iphone'))
        deviceName += ' on iOS';
    return { deviceName, deviceType };
};
exports.parseDeviceInfo = parseDeviceInfo;
