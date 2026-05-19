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
const user_model_1 = require("../models/user.model");
const profile_model_1 = require("../models/profile.model");
const providerProfile_model_1 = require("../models/providerProfile.model");
const auditLog_model_1 = require("../models/auditLog.model");
const stepUpVerification_model_1 = require("../models/stepUpVerification.model");
const googleAuth_service_1 = __importDefault(require("./googleAuth.service"));
const sessionManagement_service_1 = __importDefault(require("./sessionManagement.service"));
const authUtils_1 = require("../utils/authUtils");
const emailService_1 = require("../utils/emailService");
const AppError_1 = __importDefault(require("../utils/AppError"));
/**
 * OAuth Service - Google Authentication
 *
 * This service orchestrates the complete Google OAuth flow with:
 * 1. Google idToken verification
 * 2. User lookup/creation
 * 3. Role assignment (backend-controlled)
 * 4. Step-up verification for PROVIDER role
 * 5. JWT issuance
 * 6. Session management
 * 7. Audit logging
 */
class OAuthService {
    /**
     * Main Google Authentication Flow
     *
     * @param idToken - Google idToken from frontend
     * @param requestedRole - Role requested by frontend (USER or PROVIDER)
     * @param deviceInfo - Device information
     * @returns Authentication response with tokens and user data
     */
    authenticateWithGoogle(idToken, requestedRole, deviceInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // STEP 1: Verify Google idToken
                // This is the FIRST line of defense - we NEVER trust frontend blindly
                const googleUser = yield googleAuth_service_1.default.verifyIdToken(idToken);
                // STEP 2: Find or create user
                const { user, isFirstLogin } = yield this.findOrCreateUser(googleUser, requestedRole);
                // STEP 3: Validate role assignment
                const finalRole = yield this.validateRoleAssignment(user, requestedRole, isFirstLogin);
                // STEP 4: Check if step-up verification is required
                const requiresStepUp = yield this.checkStepUpRequired(user, finalRole, isFirstLogin);
                if (requiresStepUp) {
                    // Initiate step-up verification
                    yield this.initiateStepUpVerification(user, deviceInfo);
                    return {
                        requiresStepUp: true,
                        message: 'Additional verification required for PROVIDER access',
                        user: {
                            id: user._id.toString(),
                            email: user.email,
                            fullName: user.fullName,
                            role: user.role,
                            isEmailVerified: user.isEmailVerified,
                            authProvider: user.authProvider,
                        },
                    };
                }
                // STEP 5: Generate device ID
                const fullDeviceInfo = Object.assign({ deviceId: deviceInfo.deviceId || (0, authUtils_1.generateDeviceId)(deviceInfo.userAgent || '', deviceInfo.ipAddress || '') }, deviceInfo);
                // STEP 6: Issue backend JWT tokens
                const accessToken = (0, authUtils_1.generateToken)({
                    userId: user._id.toString(),
                    role: user.role,
                });
                const refreshToken = (0, authUtils_1.generateRefreshToken)({
                    userId: user._id.toString(),
                    role: user.role,
                });
                // STEP 7: Create session
                const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
                yield sessionManagement_service_1.default.createSession(user._id.toString(), accessToken, refreshToken, fullDeviceInfo, expiresAt);
                // STEP 8: Update last login
                user.lastLoginAt = new Date();
                yield user.save();
                // STEP 9: Log successful authentication
                yield this.logAuthEvent(user._id.toString(), auditLog_model_1.AuditEventType.GOOGLE_AUTH_SUCCESS, fullDeviceInfo, 'Google authentication successful', auditLog_model_1.RiskLevel.LOW);
                // STEP 10: Return response
                return {
                    requiresStepUp: false,
                    message: 'Authentication successful',
                    user: {
                        id: user._id.toString(),
                        email: user.email,
                        fullName: user.fullName,
                        role: user.role,
                        isEmailVerified: user.isEmailVerified,
                        authProvider: user.authProvider,
                        profilePic: user.googlePicture || user.profilePic,
                    },
                    session: {
                        accessToken,
                        refreshToken,
                        expiresAt: expiresAt.toISOString(),
                    },
                };
            }
            catch (error) {
                // Log failed authentication
                yield this.logAuthEvent(undefined, auditLog_model_1.AuditEventType.GOOGLE_AUTH_FAILED, deviceInfo, `Google authentication failed: ${error.message}`, auditLog_model_1.RiskLevel.MEDIUM);
                throw error;
            }
        });
    }
    /**
     * Find existing user or create new user
     *
     * Logic:
     * - Search by googleId (primary identifier)
     * - If not found, search by email (for account linking)
     * - If still not found, create new user
     */
    findOrCreateUser(googleUser, requestedRole) {
        return __awaiter(this, void 0, void 0, function* () {
            // Try to find user by Google ID
            let user = yield user_model_1.User.findOne({ googleId: googleUser.googleId });
            if (user) {
                // Existing Google user
                return { user, isFirstLogin: false };
            }
            // Try to find user by email (account linking scenario)
            user = yield user_model_1.User.findOne({ email: googleUser.email });
            if (user) {
                // User exists with email auth - link Google account
                if (user.authProvider === user_model_1.AuthProvider.EMAIL) {
                    user.googleId = googleUser.googleId;
                    user.googleEmail = googleUser.email;
                    user.googlePicture = googleUser.picture;
                    user.authProvider = user_model_1.AuthProvider.GOOGLE; // Switch to Google auth
                    user.isEmailVerified = true; // Google verified the email
                    yield user.save();
                    return { user, isFirstLogin: false };
                }
                // User exists with different OAuth provider
                throw new AppError_1.default(`Email already registered with ${user.authProvider}`, 409, 'EMAIL_ALREADY_EXISTS');
            }
            // Create new user
            user = yield user_model_1.User.create({
                fullName: googleUser.name,
                email: googleUser.email,
                googleId: googleUser.googleId,
                googleEmail: googleUser.email,
                googlePicture: googleUser.picture,
                role: requestedRole,
                isEmailVerified: true, // Google verified the email
                authProvider: user_model_1.AuthProvider.GOOGLE,
                roleAssignedAt: new Date(),
                roleAssignedBy: 'system',
                isActive: true,
                isSuspended: false,
            });
            // Create appropriate profile
            if (requestedRole === user_model_1.UserRole.PROVIDER) {
                yield providerProfile_model_1.ProviderProfile.create({
                    providerId: user._id,
                    restaurantName: googleUser.name,
                    contactEmail: googleUser.email,
                    phoneNumber: '0000000000',
                    restaurantAddress: 'To be updated',
                    verificationStatus: 'PENDING',
                    isActive: true,
                });
            }
            else {
                yield profile_model_1.Profile.create({
                    userId: user._id,
                    name: googleUser.name,
                    isActive: true,
                });
            }
            // Log account creation
            yield auditLog_model_1.AuditLog.create({
                eventType: auditLog_model_1.AuditEventType.ACCOUNT_CREATED,
                userId: user._id,
                email: user.email,
                action: `New ${requestedRole} account created via Google OAuth`,
                result: 'success',
                riskLevel: auditLog_model_1.RiskLevel.LOW,
                timestamp: new Date(),
            });
            return { user, isFirstLogin: true };
        });
    }
    /**
     * Validate role assignment
     *
     * Security Rules:
     * 1. First login: Assign requested role (with validation)
     * 2. Existing user: Use database role (IGNORE frontend request)
     * 3. Role upgrade: Requires explicit workflow (not handled here)
     */
    validateRoleAssignment(user, requestedRole, isFirstLogin) {
        return __awaiter(this, void 0, void 0, function* () {
            if (isFirstLogin) {
                // First login: Validate requested role
                if (!Object.values(user_model_1.UserRole).includes(requestedRole)) {
                    throw new AppError_1.default('Invalid role requested', 400, 'INVALID_ROLE');
                }
                // PROVIDER role requires additional validation
                if (requestedRole === user_model_1.UserRole.PROVIDER) {
                    // Check if PROVIDER signups are allowed
                    const providerSignupsEnabled = process.env.ALLOW_PROVIDER_SIGNUPS !== 'false';
                    if (!providerSignupsEnabled) {
                        throw new AppError_1.default('PROVIDER signups are currently disabled', 403, 'PROVIDER_SIGNUPS_DISABLED');
                    }
                }
                return requestedRole;
            }
            // Existing user: ALWAYS use database role
            // Frontend cannot change role on subsequent logins
            if (requestedRole !== user.role) {
                console.warn(`Role mismatch for user ${user.email}: ` +
                    `Requested ${requestedRole}, but user has ${user.role}. ` +
                    `Using database role (${user.role}).`);
            }
            return user.role;
        });
    }
    /**
     * Check if step-up verification is required
     *
     * Step-up verification is required for:
     * 1. First PROVIDER login
     * 2. PROVIDER role upgrade
     * 3. Suspicious login patterns (location change, new device)
     */
    checkStepUpRequired(user, role, isFirstLogin) {
        return __awaiter(this, void 0, void 0, function* () {
            const stepUpEnabled = process.env.ENABLE_STEP_UP_VERIFICATION !== 'false';
            if (!stepUpEnabled) {
                return false;
            }
            // Check 1: First PROVIDER login
            if (isFirstLogin && role === user_model_1.UserRole.PROVIDER) {
                return true;
            }
            // Check 2: PROVIDER role but not approved
            if (role === user_model_1.UserRole.PROVIDER && !user.isProviderApproved) {
                const requireApproval = process.env.REQUIRE_PROVIDER_APPROVAL === 'true';
                if (requireApproval) {
                    return true;
                }
            }
            // Check 3: Suspicious login patterns (TODO: implement)
            // - Location change
            // - New device
            // - Unusual time
            return false;
        });
    }
    /**
     * Initiate step-up verification
     *
     * For PROVIDER role, we send an OTP to the user's email
     */
    initiateStepUpVerification(user, deviceInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            // Generate OTP
            const rawOtp = (0, authUtils_1.generateOtp)();
            const hashedOtp = (0, authUtils_1.hashOtp)(rawOtp);
            // Create step-up verification record
            yield stepUpVerification_model_1.StepUpVerification.create({
                userId: user._id,
                purpose: stepUpVerification_model_1.StepUpPurpose.PROVIDER_FIRST_LOGIN,
                method: stepUpVerification_model_1.StepUpMethod.EMAIL_OTP,
                status: stepUpVerification_model_1.StepUpStatus.PENDING,
                otp: hashedOtp,
                otpAttempts: 0,
                maxOtpAttempts: 3,
                requestedAction: 'PROVIDER login',
                ipAddress: deviceInfo.ipAddress,
                deviceId: deviceInfo.deviceId,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            });
            // Send OTP email
            yield (0, emailService_1.sendEmail)({
                email: user.email,
                subject: 'PROVIDER Access Verification',
                message: `Your verification code for PROVIDER access is: ${rawOtp}. This code expires in 10 minutes.`,
            });
            // Log step-up initiation
            yield auditLog_model_1.AuditLog.create({
                eventType: auditLog_model_1.AuditEventType.STEP_UP_REQUIRED,
                userId: user._id,
                email: user.email,
                action: 'Step-up verification initiated for PROVIDER access',
                result: 'success',
                ipAddress: deviceInfo.ipAddress,
                deviceId: deviceInfo.deviceId,
                riskLevel: auditLog_model_1.RiskLevel.MEDIUM,
                timestamp: new Date(),
            });
        });
    }
    /**
     * Verify step-up OTP
     */
    verifyStepUpOtp(email, otp, deviceInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findOne({ email: email.toLowerCase().trim() });
            if (!user) {
                throw new AppError_1.default('User not found', 404, 'USER_NOT_FOUND');
            }
            // Find pending step-up verification
            const verification = yield stepUpVerification_model_1.StepUpVerification.findOne({
                userId: user._id,
                status: stepUpVerification_model_1.StepUpStatus.PENDING,
                expiresAt: { $gt: new Date() },
            });
            if (!verification) {
                throw new AppError_1.default('No pending verification found', 404, 'NO_VERIFICATION');
            }
            // Check OTP attempts
            if (verification.otpAttempts >= verification.maxOtpAttempts) {
                verification.status = stepUpVerification_model_1.StepUpStatus.FAILED;
                yield verification.save();
                throw new AppError_1.default('Maximum OTP attempts exceeded', 429, 'MAX_ATTEMPTS');
            }
            // Verify OTP
            const hashedOtp = (0, authUtils_1.hashOtp)(otp.trim());
            if (hashedOtp !== verification.otp) {
                verification.otpAttempts += 1;
                yield verification.save();
                throw new AppError_1.default('Invalid OTP', 400, 'INVALID_OTP');
            }
            // Mark verification as complete
            verification.status = stepUpVerification_model_1.StepUpStatus.VERIFIED;
            verification.verifiedAt = new Date();
            yield verification.save();
            // Approve PROVIDER role
            user.isProviderApproved = true;
            user.providerApprovedAt = new Date();
            user.providerApprovedBy = 'system';
            yield user.save();
            // Log step-up success
            yield auditLog_model_1.AuditLog.create({
                eventType: auditLog_model_1.AuditEventType.STEP_UP_SUCCESS,
                userId: user._id,
                email: user.email,
                action: 'Step-up verification completed successfully',
                result: 'success',
                ipAddress: deviceInfo.ipAddress,
                deviceId: deviceInfo.deviceId,
                riskLevel: auditLog_model_1.RiskLevel.LOW,
                timestamp: new Date(),
            });
            // Generate tokens and create session
            const fullDeviceInfo = Object.assign({ deviceId: deviceInfo.deviceId || (0, authUtils_1.generateDeviceId)(deviceInfo.userAgent || '', deviceInfo.ipAddress || '') }, deviceInfo);
            const accessToken = (0, authUtils_1.generateToken)({
                userId: user._id.toString(),
                role: user.role,
            });
            const refreshToken = (0, authUtils_1.generateRefreshToken)({
                userId: user._id.toString(),
                role: user.role,
            });
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            yield sessionManagement_service_1.default.createSession(user._id.toString(), accessToken, refreshToken, fullDeviceInfo, expiresAt);
            return {
                requiresStepUp: false,
                message: 'Verification successful',
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    authProvider: user.authProvider,
                    profilePic: user.googlePicture || user.profilePic,
                },
                session: {
                    accessToken,
                    refreshToken,
                    expiresAt: expiresAt.toISOString(),
                },
            };
        });
    }
    /**
     * Log authentication event
     */
    logAuthEvent(userId, eventType, deviceInfo, action, riskLevel) {
        return __awaiter(this, void 0, void 0, function* () {
            yield auditLog_model_1.AuditLog.create({
                eventType,
                userId: userId ? userId : undefined,
                action,
                result: eventType.includes('FAILED') ? 'failure' : 'success',
                ipAddress: deviceInfo.ipAddress,
                userAgent: deviceInfo.userAgent,
                deviceId: deviceInfo.deviceId,
                country: deviceInfo.country,
                city: deviceInfo.city,
                riskLevel,
                timestamp: new Date(),
            });
        });
    }
}
exports.default = new OAuthService();
