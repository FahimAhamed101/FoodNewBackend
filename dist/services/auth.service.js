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
const otp_model_1 = require("../models/otp.model");
const cart_model_1 = require("../models/cart.model");
const favorite_model_1 = require("../models/favorite.model");
const notification_model_1 = require("../models/notification.model");
const paymentMethod_model_1 = require("../models/paymentMethod.model");
const session_model_1 = require("../models/session.model");
const authUtils_1 = require("../utils/authUtils");
const AppError_1 = __importDefault(require("../utils/AppError"));
const emailService_1 = require("../utils/emailService");
const blacklistedToken_model_1 = require("../models/blacklistedToken.model");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const emailTemplate_1 = require("../utils/emailTemplate");
class AuthService {
    logout(token) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1) Decode token to get expiry (without verifying again, as middleware already verified it)
            const decoded = jsonwebtoken_1.default.decode(token);
            // 2) Add to blacklist until it would have expired naturally
            // exp is in seconds, convert to Date
            const expiresAt = new Date(decoded.exp * 1000);
            yield blacklistedToken_model_1.BlacklistedToken.create({
                token,
                expiresAt,
            });
            return { message: 'Logged out successfully' };
        });
    }
    signup(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { fullName, email, password, role } = data;
            // Check if user exists
            const existingUser = yield user_model_1.User.findOne({ email });
            if (existingUser) {
                throw new AppError_1.default('Email already exists', 400);
            }
            // Hash password
            const passwordHash = yield (0, authUtils_1.hashPassword)(password);
            const resolvedRole = role || user_model_1.UserRole.CUSTOMER;
            // Create user
            const user = yield user_model_1.User.create({
                fullName,
                email,
                passwordHash,
                role: resolvedRole,
                isEmailVerified: false,
                authProvider: 'email',
            });
            // Auto-create appropriate profile
            if (resolvedRole === user_model_1.UserRole.PROVIDER) {
                yield providerProfile_model_1.ProviderProfile.create({
                    providerId: user._id,
                    restaurantName: fullName, // Seed with full name initially
                    contactEmail: email,
                    phoneNumber: '0000000000', // Placeholder
                    restaurantAddress: 'To be updated', // Placeholder
                    isActive: true
                });
            }
            else {
                yield profile_model_1.Profile.create({
                    userId: user._id,
                    name: fullName,
                    isActive: true
                });
            }
            const normalizedEmail = email.toLowerCase().trim();
            // Generate OTP
            const rawOtp = (0, authUtils_1.generateOtp)();
            const hashedOtp = (0, authUtils_1.hashOtp)(rawOtp);
            // Clear any existing verification OTPs for this email
            yield otp_model_1.Otp.deleteMany({ email: normalizedEmail, purpose: otp_model_1.OtpPurpose.EMAIL_VERIFY });
            // Save OTP
            yield otp_model_1.Otp.create({
                email: normalizedEmail,
                otp: hashedOtp,
                purpose: otp_model_1.OtpPurpose.EMAIL_VERIFY,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            });
            // Send OTP via Email
            yield (0, emailService_1.sendEmail)({
                email: normalizedEmail,
                subject: 'DineFive - Verify Your Email',
                message: `Welcome to DineFive! Your verification code is: ${rawOtp}. This code expires in 10 minutes.`,
                html: (0, emailTemplate_1.getOtpEmailTemplate)(rawOtp, fullName)
            });
            const accessToken = (0, authUtils_1.generateToken)({ userId: user._id.toString(), role: user.role });
            const refreshToken = (0, authUtils_1.generateRefreshToken)({ userId: user._id.toString(), role: user.role });
            return {
                message: 'OTP sent successfully for email verification.',
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isEmailVerified,
                    authProvider: user.authProvider,
                },
                session: {
                    accessToken,
                    refreshToken,
                    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                },
            };
        });
    }
    providerSignup(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password, streetAddress, state } = data;
            // Generate smart defaults for required fields not in minimal body
            const fullName = email.split('@')[0];
            const restaurantName = `${fullName}'s Kitchen`;
            const phoneNumber = '0000000000';
            const city = 'Pending Update';
            // 1. Core User Creation
            const existingUser = yield user_model_1.User.findOne({ email });
            if (existingUser) {
                throw new AppError_1.default('Email already registered', 400);
            }
            const passwordHash = yield (0, authUtils_1.hashPassword)(password);
            // Explicitly set PROVIDER role to prevent role base tampering
            const user = yield user_model_1.User.create({
                fullName,
                email,
                passwordHash,
                role: user_model_1.UserRole.PROVIDER,
                isEmailVerified: false,
                authProvider: 'email',
            });
            // 2. Provider Profile Creation (Separated from User model)
            yield providerProfile_model_1.ProviderProfile.create({
                providerId: user._id,
                restaurantName,
                contactEmail: email,
                phoneNumber,
                restaurantAddress: streetAddress || 'Pending Address',
                city,
                state: state || 'Pending State',
                zipCode: '00000',
                verificationStatus: 'PENDING',
                isActive: true
            });
            const normalizedEmail = email.toLowerCase().trim();
            // 3. Security: Email Verification Trigger
            const rawOtp = (0, authUtils_1.generateOtp)();
            const hashedOtp = (0, authUtils_1.hashOtp)(rawOtp);
            yield otp_model_1.Otp.deleteMany({ email: normalizedEmail, purpose: otp_model_1.OtpPurpose.EMAIL_VERIFY });
            yield otp_model_1.Otp.create({
                email: normalizedEmail,
                otp: hashedOtp,
                purpose: otp_model_1.OtpPurpose.EMAIL_VERIFY,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            });
            yield (0, emailService_1.sendEmail)({
                email: normalizedEmail,
                subject: 'DineFive Provider Onboarding: Verify Your Email',
                message: `Welcome to DineFive Provider Network! Your verification code is: ${rawOtp}. This code expires in 10 minutes.`,
                html: (0, emailTemplate_1.getOtpEmailTemplate)(rawOtp, fullName)
            });
            // 4. Response with JWT
            const accessToken = (0, authUtils_1.generateToken)({ userId: user._id.toString(), role: user.role });
            const refreshToken = (0, authUtils_1.generateRefreshToken)({ userId: user._id.toString(), role: user.role });
            return {
                message: 'Provider account created. Please verify your email to unlock dashboard features.',
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isEmailVerified,
                },
                session: {
                    accessToken,
                    refreshToken,
                    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                },
            };
        });
    }
    resendVerification(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const normalizedEmail = email.toLowerCase().trim();
            const user = yield user_model_1.User.findOne({ email: normalizedEmail });
            if (!user) {
                throw new AppError_1.default('User not found', 404, 'USER_NOT_FOUND');
            }
            if (user.isEmailVerified) {
                throw new AppError_1.default('Email already verified', 400, 'ALREADY_VERIFIED');
            }
            const rawOtp = (0, authUtils_1.generateOtp)();
            const hashedOtp = (0, authUtils_1.hashOtp)(rawOtp);
            // Clear any existing verification OTPs
            yield otp_model_1.Otp.deleteMany({ email: normalizedEmail, purpose: otp_model_1.OtpPurpose.EMAIL_VERIFY });
            // Save new OTP
            yield otp_model_1.Otp.create({
                email: normalizedEmail,
                otp: hashedOtp,
                purpose: otp_model_1.OtpPurpose.EMAIL_VERIFY,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            });
            // Send OTP via Email
            yield (0, emailService_1.sendEmail)({
                email: normalizedEmail,
                subject: 'DineFive - Verification OTP',
                message: `Hi ${user.fullName || 'there'}, your new verification code is: ${rawOtp}. This code expires in 10 minutes.`,
                html: (0, emailTemplate_1.getOtpEmailTemplate)(rawOtp, user.fullName || 'Valued Member'),
            });
            return { message: 'Verification OTP resent successfully' };
        });
    }
    verifyEmail(email, otp) {
        return __awaiter(this, void 0, void 0, function* () {
            const normalizedEmail = email.toLowerCase().trim();
            const trimmedOtp = otp.trim();
            // 1) Find the OTP record
            const otpRecord = yield otp_model_1.Otp.findOne({
                email: normalizedEmail,
                purpose: otp_model_1.OtpPurpose.EMAIL_VERIFY,
            });
            if (!otpRecord) {
                // Check if user is already verified
                const user = yield user_model_1.User.findOne({ email: normalizedEmail });
                if (user === null || user === void 0 ? void 0 : user.isEmailVerified) {
                    return { message: 'Email already verified' };
                }
                throw new AppError_1.default('Invalid or expired OTP', 400, 'INVALID_OTP');
            }
            // Check if expired (in case TTL hasn't run yet)
            if (otpRecord.expiresAt < new Date()) {
                yield otp_model_1.Otp.deleteOne({ _id: otpRecord._id });
                throw new AppError_1.default('OTP has expired', 400, 'OTP_EXPIRED');
            }
            // 2) Compare hashed OTP
            if (!(0, authUtils_1.compareOtp)(trimmedOtp, otpRecord.otp)) {
                throw new AppError_1.default('Invalid OTP', 400, 'INVALID_OTP');
            }
            // 3) Mark user as verified
            yield user_model_1.User.findOneAndUpdate({ email: normalizedEmail }, { isEmailVerified: true });
            // 4) Delete all validation OTPs for this user
            yield otp_model_1.Otp.deleteMany({ email: normalizedEmail, purpose: otp_model_1.OtpPurpose.EMAIL_VERIFY });
            return { message: 'Email verified successfully' };
        });
    }
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const normalizedEmail = email.toLowerCase().trim();
            const user = yield user_model_1.User.findOne({ email: normalizedEmail }).select('+passwordHash');
            if (!user || !user.passwordHash || !(yield (0, authUtils_1.comparePassword)(password, user.passwordHash))) {
                throw new AppError_1.default('Invalid email or password', 401);
            }
            if (!user.isEmailVerified) {
                throw new AppError_1.default('Please verify your email first', 401);
            }
            if (!user.isActive) {
                throw new AppError_1.default('Your account is deactivated. Please contact support.', 403);
            }
            if (user.isSuspended) {
                throw new AppError_1.default(`Your account is suspended. Reason: ${user.suspendedReason || 'N/A'}`, 403);
            }
            const accessToken = (0, authUtils_1.generateToken)({
                userId: user._id.toString(),
                role: user.role
            });
            const refreshToken = (0, authUtils_1.generateRefreshToken)({
                userId: user._id.toString(),
                role: user.role
            });
            // Update last login
            user.lastLoginAt = new Date();
            yield user.save({ validateBeforeSave: false });
            return {
                message: 'Logged in successfully',
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isEmailVerified,
                    authProvider: user.authProvider,
                },
                session: {
                    accessToken,
                    refreshToken,
                    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                }
            };
        });
    }
    forgotPassword(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const normalizedEmail = email.toLowerCase().trim();
            const user = yield user_model_1.User.findOne({ email: normalizedEmail });
            if (!user) {
                throw new AppError_1.default('If an account with that email exists, we have sent an OTP', 200);
            }
            const rawOtp = (0, authUtils_1.generateOtp)();
            const hashedOtp = (0, authUtils_1.hashOtp)(rawOtp);
            // Clear any existing reset OTPs for this email
            yield otp_model_1.Otp.deleteMany({ email: normalizedEmail, purpose: otp_model_1.OtpPurpose.RESET_PASSWORD });
            yield otp_model_1.Otp.create({
                email: normalizedEmail,
                otp: hashedOtp,
                purpose: otp_model_1.OtpPurpose.RESET_PASSWORD,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            });
            // Send Reset OTP via Email
            yield (0, emailService_1.sendEmail)({
                email: normalizedEmail,
                subject: 'Password Reset OTP',
                message: `Use this code to reset your password: ${rawOtp}. This code expires in 10 minutes.`,
            });
            return { message: 'OTP sent to your email' };
        });
    }
    verifyForgotOtp(email, otp) {
        return __awaiter(this, void 0, void 0, function* () {
            const normalizedEmail = email.toLowerCase().trim();
            const otpRecord = yield otp_model_1.Otp.findOne({
                email: normalizedEmail,
                purpose: otp_model_1.OtpPurpose.RESET_PASSWORD,
            });
            if (!otpRecord) {
                throw new AppError_1.default('Invalid or expired OTP', 400, 'INVALID_OTP');
            }
            if (!(0, authUtils_1.compareOtp)(otp, otpRecord.otp)) {
                throw new AppError_1.default('Invalid OTP', 400, 'INVALID_OTP');
            }
            const user = yield user_model_1.User.findOne({ email: normalizedEmail });
            if (!user) {
                throw new AppError_1.default('User not found', 404, 'USER_NOT_FOUND');
            }
            const accessToken = (0, authUtils_1.generateToken)({
                userId: user._id.toString(),
                role: user.role
            });
            return {
                message: 'OTP verified successfully. You can now reset your password.',
                accessToken
            };
        });
    }
    resetPassword(userId, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const passwordHash = yield (0, authUtils_1.hashPassword)(newPassword);
            const user = yield user_model_1.User.findByIdAndUpdate(userId, { passwordHash }, { new: true });
            if (!user) {
                throw new AppError_1.default('User not found', 404);
            }
            // Clear all reset OTPs for this user
            yield otp_model_1.Otp.deleteMany({ email: user.email, purpose: otp_model_1.OtpPurpose.RESET_PASSWORD });
            return { message: 'Password reset successful' };
        });
    }
    changePassword(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { currentPassword, newPassword } = data;
            const user = yield user_model_1.User.findById(userId).select('+passwordHash');
            if (!user) {
                throw new AppError_1.default('User not found', 404);
            }
            if (!user.passwordHash || !(yield (0, authUtils_1.comparePassword)(currentPassword, user.passwordHash))) {
                throw new AppError_1.default('Invalid current password', 400);
            }
            const passwordHash = yield (0, authUtils_1.hashPassword)(newPassword);
            user.passwordHash = passwordHash;
            yield user.save();
            return { message: 'Password changed successfully' };
        });
    }
    deleteAccount(userId, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findById(userId).select('+passwordHash');
            if (!user) {
                throw new AppError_1.default('User not found', 404);
            }
            const originalEmail = user.email;
            const deletedEmail = `deleted-${user._id.toString()}@deleted.local`;
            yield Promise.all([
                profile_model_1.Profile.updateOne({ userId: user._id }, {
                    $set: {
                        name: '',
                        phone: '',
                        address: '',
                        city: '',
                        state: '',
                        profilePic: '',
                        avatar: '',
                        bio: '',
                        isActive: false,
                    },
                    $unset: { dateOfBirth: 1 },
                }),
                providerProfile_model_1.ProviderProfile.updateOne({ providerId: user._id }, {
                    $set: {
                        restaurantName: 'Deleted Restaurant',
                        contactEmail: deletedEmail,
                        phoneNumber: '0000000000',
                        restaurantAddress: 'Deleted account',
                        city: 'Deleted',
                        state: 'Deleted',
                        zipCode: '',
                        verificationDocuments: [],
                        isVerify: false,
                        isActive: false,
                        status: 'BLOCKED',
                        blockReason: 'Account deleted by user',
                    },
                }),
                cart_model_1.Cart.deleteMany({ userId: user._id }),
                favorite_model_1.Favorite.deleteMany({ userId: user._id }),
                notification_model_1.Notification.deleteMany({ userId: user._id }),
                paymentMethod_model_1.PaymentMethod.deleteMany({ userId: user._id }),
                otp_model_1.Otp.deleteMany({ email: originalEmail }),
                session_model_1.Session.updateMany({ userId: user._id, isRevoked: false }, {
                    $set: {
                        isRevoked: true,
                        revokedAt: new Date(),
                        revokedReason: 'Account deleted',
                    },
                }),
            ]);
            if (token) {
                const decoded = jsonwebtoken_1.default.decode(token);
                yield blacklistedToken_model_1.BlacklistedToken.create({
                    token,
                    expiresAt: (decoded === null || decoded === void 0 ? void 0 : decoded.exp) ? new Date(decoded.exp * 1000) : new Date(Date.now() + 60 * 60 * 1000),
                });
            }
            user.fullName = 'Deleted User';
            user.email = deletedEmail;
            user.passwordHash = undefined;
            user.isEmailVerified = false;
            user.isActive = false;
            user.isSuspended = true;
            user.suspendedReason = 'Account deleted by user';
            user.suspendedAt = new Date();
            user.phone = '';
            user.profilePic = '';
            user.googleId = undefined;
            user.googleEmail = undefined;
            user.googlePicture = undefined;
            yield user.save({ validateBeforeSave: false });
            return { message: 'Account deleted successfully' };
        });
    }
}
exports.default = new AuthService();
