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
const user_model_1 = require("../models/user.model");
const providerProfile_model_1 = require("../models/providerProfile.model");
const providerDocument_model_1 = require("../models/providerDocument.model");
const otp_model_1 = require("../models/otp.model");
const authUtils_1 = require("../utils/authUtils");
const AppError_1 = __importDefault(require("../utils/AppError"));
const emailService_1 = require("../utils/emailService");
const emailTemplate_1 = require("../utils/emailTemplate");
class ProviderOnboardingService {
    parseCoordinate(value, min, max) {
        const parsed = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(parsed))
            return undefined;
        if (parsed < min || parsed > max)
            return undefined;
        return Number(parsed.toFixed(6));
    }
    parseTaxRate(value) {
        if (value === undefined || value === null || value === '')
            return undefined;
        const normalized = typeof value === 'string' ? value.replace('%', '').trim() : value;
        const parsed = typeof normalized === 'number' ? normalized : Number(normalized);
        if (!Number.isFinite(parsed))
            return undefined;
        if (parsed < 0 || parsed > 100)
            return undefined;
        return Number(parsed.toFixed(2));
    }
    extractLocation(data) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const latRaw = (_d = (_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.location) === null || _a === void 0 ? void 0 : _a.lat) !== null && _b !== void 0 ? _b : data === null || data === void 0 ? void 0 : data['location[lat]']) !== null && _c !== void 0 ? _c : data === null || data === void 0 ? void 0 : data['location.lat']) !== null && _d !== void 0 ? _d : data === null || data === void 0 ? void 0 : data.lat;
        const lngRaw = (_h = (_g = (_f = (_e = data === null || data === void 0 ? void 0 : data.location) === null || _e === void 0 ? void 0 : _e.lng) !== null && _f !== void 0 ? _f : data === null || data === void 0 ? void 0 : data['location[lng]']) !== null && _g !== void 0 ? _g : data === null || data === void 0 ? void 0 : data['location.lng']) !== null && _h !== void 0 ? _h : data === null || data === void 0 ? void 0 : data.lng;
        const lat = this.parseCoordinate(latRaw, -90, 90);
        const lng = this.parseCoordinate(lngRaw, -180, 180);
        if (lat === undefined || lng === undefined)
            return undefined;
        return { lat, lng };
    }
    normalizeCuisine(value) {
        if (Array.isArray(value)) {
            return value.map((item) => String(item).trim()).filter(Boolean);
        }
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (!trimmed)
                return [];
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    return parsed.map((item) => String(item).trim()).filter(Boolean);
                }
            }
            catch (_a) {
                // Fallback to comma-separated string
            }
            return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
        }
        return [];
    }
    // ──────────────────────────────────────────────────────────
    // STEP 1: Register Email & Send OTP
    // ──────────────────────────────────────────────────────────
    registerEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[ONBOARDING] Registering email: ${email}`);
            const normalizedEmail = email.toLowerCase().trim();
            // Check if user already exists
            const existingUser = yield user_model_1.User.findOne({ email: normalizedEmail });
            if (existingUser) {
                // If already verified with password set, reject
                if (existingUser.isEmailVerified && existingUser.passwordHash) {
                    throw new AppError_1.default('Email already registered. Please login.', 400);
                }
            }
            // Create or update user
            let user = existingUser;
            if (!user) {
                user = yield user_model_1.User.create({
                    fullName: normalizedEmail.split('@')[0],
                    email: normalizedEmail,
                    role: user_model_1.UserRole.PROVIDER,
                    isEmailVerified: false,
                    authProvider: user_model_1.AuthProvider.EMAIL,
                    isProviderApproved: false,
                });
            }
            // Generate & send OTP
            const rawOtp = (0, authUtils_1.generateOtp)();
            const hashedOtp = (0, authUtils_1.hashOtp)(rawOtp);
            yield otp_model_1.Otp.deleteMany({ email: normalizedEmail, purpose: otp_model_1.OtpPurpose.EMAIL_VERIFY });
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            yield otp_model_1.Otp.create({
                email: normalizedEmail,
                otp: hashedOtp,
                purpose: otp_model_1.OtpPurpose.EMAIL_VERIFY,
                expiresAt,
            });
            yield (0, emailService_1.sendEmail)({
                email: normalizedEmail,
                subject: 'DineFive - Provider Registration Verification',
                message: `Welcome to DineFive! Your verification code is: ${rawOtp}. This code expires in 10 minutes.`,
                html: (0, emailTemplate_1.getOtpEmailTemplate)(rawOtp, user.fullName || normalizedEmail.split('@')[0])
            });
            if (process.env.NODE_ENV !== 'production') {
                console.log(`[ONBOARDING][REGISTER_EMAIL][OTP] email=${normalizedEmail} otp=${rawOtp} expiresAt=${expiresAt.toISOString()}`);
            }
            return {
                message: 'OTP sent to your email',
                data: {
                    email: normalizedEmail,
                    otpExpiresAt: expiresAt.toISOString(),
                },
            };
        });
    }
    // ──────────────────────────────────────────────────────────
    // STEP 2: Verify Email OTP
    // ──────────────────────────────────────────────────────────
    verifyEmailOtp(email, otp) {
        return __awaiter(this, void 0, void 0, function* () {
            const normalizedEmail = email.toLowerCase().trim();
            const otpRecord = yield otp_model_1.Otp.findOne({
                email: normalizedEmail,
                purpose: otp_model_1.OtpPurpose.EMAIL_VERIFY,
            });
            if (!otpRecord)
                throw new AppError_1.default('Invalid or expired OTP', 400, 'INVALID_OTP');
            if (otpRecord.expiresAt < new Date()) {
                yield otp_model_1.Otp.deleteOne({ _id: otpRecord._id });
                throw new AppError_1.default('OTP has expired', 400, 'OTP_EXPIRED');
            }
            if (!(0, authUtils_1.compareOtp)(otp.trim(), otpRecord.otp)) {
                throw new AppError_1.default('Invalid OTP', 400, 'INVALID_OTP');
            }
            const user = yield user_model_1.User.findOneAndUpdate({ email: normalizedEmail }, { isEmailVerified: true }, { new: true });
            if (!user)
                throw new AppError_1.default('User not found', 404);
            yield otp_model_1.Otp.deleteMany({ email: normalizedEmail, purpose: otp_model_1.OtpPurpose.EMAIL_VERIFY });
            const tempToken = (0, authUtils_1.generateToken)({ userId: user._id.toString(), role: user.role });
            return {
                message: 'Email verified successfully',
                data: {
                    tempToken,
                    nextStep: 'set-password',
                },
            };
        });
    }
    // ──────────────────────────────────────────────────────────
    // STEP 3: Set Password
    // ──────────────────────────────────────────────────────────
    setPassword(userId, password, confirmPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            if (password !== confirmPassword)
                throw new AppError_1.default("Passwords don't match", 400);
            const user = yield user_model_1.User.findById(userId).select('+passwordHash');
            if (!user)
                throw new AppError_1.default('User not found', 404);
            if (!user.isEmailVerified)
                throw new AppError_1.default('Please verify your email first', 400);
            // Allow setting/updating password during onboarding even if already set
            // This helps in testing and re-running onboarding steps
            /*
            if (user.passwordHash && user.isProviderApproved) {
                throw new AppError('Password already set and provider is approved.', 400, 'PASSWORD_ALREADY_SET');
            }
            */
            user.passwordHash = yield (0, authUtils_1.hashPassword)(password);
            yield user.save();
            const accessToken = (0, authUtils_1.generateToken)({ userId: user._id.toString(), role: user.role });
            const refreshToken = (0, authUtils_1.generateRefreshToken)({ userId: user._id.toString(), role: user.role });
            return {
                message: 'Password set successfully.',
                data: {
                    accessToken,
                    refreshToken,
                    user: {
                        id: user._id,
                        email: user.email,
                        role: user.role,
                        isEmailVerified: user.isEmailVerified,
                    },
                    nextStep: 'restaurant-info',
                },
            };
        });
    }
    // ──────────────────────────────────────────────────────────
    // STEP 4: Submit Restaurant Information
    // ──────────────────────────────────────────────────────────
    submitRestaurantInfo(providerId, data, restaurantImageUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const user = yield user_model_1.User.findById(providerId);
            if (!user)
                throw new AppError_1.default('User not found', 404);
            if (user.role !== user_model_1.UserRole.PROVIDER)
                throw new AppError_1.default('Only providers can submit info', 403);
            const location = this.extractLocation(data);
            const cityTaxRate = this.parseTaxRate((_c = (_b = (_a = data.cityTax) !== null && _a !== void 0 ? _a : data.city_tax) !== null && _b !== void 0 ? _b : data.taxRate) !== null && _c !== void 0 ? _c : data.tax);
            const restaurantName = data.restaurantName ||
                data.RestaurantName ||
                data.resturantName ||
                data.restaurant ||
                '';
            if (!restaurantName || !String(restaurantName).trim()) {
                throw new AppError_1.default('Restaurant name is required', 400);
            }
            const profileData = {
                restaurantName: String(restaurantName).trim(),
                contactEmail: data.email || data.contactEmail || user.email,
                phoneNumber: data.phoneNumber || data.PhoneNumebr || data.PhoneNumerb,
                restaurantAddress: data.restaurantAddress || data.RestaurantAddress,
                city: data.city || 'Pending',
                state: data.state || 'Pending',
                zipCode: data.zipCode || '',
                cuisine: this.normalizeCuisine(data.cuisine),
                verificationStatus: 'PENDING',
                isVerify: false,
            };
            if (cityTaxRate !== undefined) {
                profileData.cityTax = cityTaxRate;
                profileData.compliance = {
                    tax: {
                        region: profileData.city,
                        rate: cityTaxRate,
                    },
                };
            }
            if (location) {
                profileData.location = location;
            }
            if (restaurantImageUrl)
                profileData.profile = restaurantImageUrl;
            const profile = yield providerProfile_model_1.ProviderProfile.findOneAndUpdate({ providerId: new mongoose_1.Types.ObjectId(providerId) }, { $set: profileData }, { new: true, upsert: true, runValidators: true });
            return {
                message: 'Restaurant info saved.',
                data: {
                    profileId: profile._id,
                    restaurantName: profile.restaurantName,
                    cityTax: (_d = profile.cityTax) !== null && _d !== void 0 ? _d : 0,
                    nextStep: 'documents-upload',
                },
            };
        });
    }
    // ──────────────────────────────────────────────────────────
    // STEP 5: Upload Required Documents
    // ──────────────────────────────────────────────────────────
    uploadDocuments(providerId, data, files) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findById(providerId);
            if (!user)
                throw new AppError_1.default('User not found', 404);
            const profile = yield providerProfile_model_1.ProviderProfile.findOne({ providerId: new mongoose_1.Types.ObjectId(providerId) });
            if (!profile)
                throw new AppError_1.default('Submit restaurant info first', 400);
            const docData = {
                providerId: new mongoose_1.Types.ObjectId(providerId),
                EIN: data.EIN || '',
                businessBankName: data.businessBankName || '',
                businessBankAccountNumber: data.businessBankAccountNumber || '',
                businessBankRoutingNumber: data.businessBankRoutingNumber || '',
                documentStatus: 'pending',
                submittedAt: new Date(),
            };
            if (files.businessLicenseFile)
                docData.businessLicense = files.businessLicenseFile[0].path;
            if (files.healthPermitFile)
                docData.healthPermit = files.healthPermitFile[0].path;
            if (files.stateOrCityLicenseFile)
                docData.stateOrCityLicense = files.stateOrCityLicenseFile[0].path;
            if (files.proofOfAddressFile)
                docData.proofOfAddress = files.proofOfAddressFile[0].path;
            if (files.ownerGovernmentID)
                docData.ownerGovernmentID = files.ownerGovernmentID[0].path;
            const doc = yield providerDocument_model_1.ProviderDocument.findOneAndUpdate({ providerId: new mongoose_1.Types.ObjectId(providerId) }, { $set: docData }, { new: true, upsert: true });
            yield providerProfile_model_1.ProviderProfile.findOneAndUpdate({ providerId: new mongoose_1.Types.ObjectId(providerId) }, { verificationStatus: 'PENDING', isVerify: false });
            return {
                message: 'Documents uploaded successfully.',
                data: { documentStatus: 'pending' },
            };
        });
    }
    // ──────────────────────────────────────────────────────────
    // STEP 6A: Admin - Get Pending Providers
    // ──────────────────────────────────────────────────────────
    getPendingProviders(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.limit) || 20;
            const skip = (page - 1) * limit;
            const filter = { verificationStatus: query.verificationStatus || 'PENDING' };
            const [profiles, total] = yield Promise.all([
                providerProfile_model_1.ProviderProfile.find(filter)
                    .sort({ updatedAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate({ path: 'providerId', select: 'fullName email phone' })
                    .lean(),
                providerProfile_model_1.ProviderProfile.countDocuments(filter),
            ]);
            const providers = yield Promise.all(profiles
                .filter((p) => p.providerId)
                .map((profile) => __awaiter(this, void 0, void 0, function* () {
                const doc = yield providerDocument_model_1.ProviderDocument.findOne({ providerId: profile.providerId._id }).lean();
                return {
                    id: profile.providerId._id,
                    ownerName: profile.providerId.fullName,
                    ownerEmail: profile.providerId.email,
                    restaurantName: profile.restaurantName || 'N/A',
                    phoneNumber: profile.phoneNumber || profile.providerId.phone || 'N/A',
                    address: profile.restaurantAddress || 'N/A',
                    verificationStatus: profile.verificationStatus,
                    documentStatus: (doc === null || doc === void 0 ? void 0 : doc.documentStatus) || 'not_submitted',
                    submittedAt: profile.updatedAt,
                    documents: doc || null,
                };
            })));
            return {
                providers,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalProviders: total,
                },
            };
        });
    }
    // ──────────────────────────────────────────────────────────
    // STEP 6B: Admin - Get Provider Verification Details
    // ──────────────────────────────────────────────────────────
    getProviderVerificationDetails(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const pId = new mongoose_1.Types.ObjectId(providerId);
            const [user, profile, doc] = yield Promise.all([
                user_model_1.User.findById(pId).lean(),
                providerProfile_model_1.ProviderProfile.findOne({ providerId: pId }).lean(),
                providerDocument_model_1.ProviderDocument.findOne({ providerId: pId }).lean(),
            ]);
            if (!user)
                throw new AppError_1.default('Provider not found', 404);
            return { user, profile, documents: doc };
        });
    }
    // ──────────────────────────────────────────────────────────
    // STEP 6C/D: Admin - Approve or Reject Provider
    // ──────────────────────────────────────────────────────────
    verifyProvider(providerId, adminId, action, rejectionReason, adminNotes) {
        return __awaiter(this, void 0, void 0, function* () {
            const pId = new mongoose_1.Types.ObjectId(providerId);
            const user = yield user_model_1.User.findById(pId);
            if (!user)
                throw new AppError_1.default('Provider not found', 404);
            const doc = yield providerDocument_model_1.ProviderDocument.findOne({ providerId: pId });
            if (!doc)
                throw new AppError_1.default('No documents found', 400);
            if (action === 'approve') {
                user.isProviderApproved = true;
                user.providerApprovedAt = new Date();
                user.providerApprovedBy = adminId;
                yield user.save();
                doc.documentStatus = 'approved';
                doc.reviewedBy = new mongoose_1.Types.ObjectId(adminId);
                doc.reviewedAt = new Date();
                doc.adminNotes = adminNotes || '';
                yield doc.save();
                yield providerProfile_model_1.ProviderProfile.findOneAndUpdate({ providerId: pId }, { verificationStatus: 'APPROVED', isVerify: true });
                yield (0, emailService_1.sendEmail)({
                    email: user.email,
                    subject: 'EMDR - Restaurant Approved!',
                    message: 'Congratulations! Your restaurant has been approved.',
                });
                return { message: 'Provider approved successfully' };
            }
            else if (action === 'reject') {
                if (!rejectionReason)
                    throw new AppError_1.default('Rejection reason required', 400);
                user.isProviderApproved = false;
                yield user.save();
                doc.documentStatus = 'rejected';
                doc.rejectionReason = rejectionReason;
                doc.reviewedBy = new mongoose_1.Types.ObjectId(adminId);
                doc.reviewedAt = new Date();
                yield doc.save();
                yield providerProfile_model_1.ProviderProfile.findOneAndUpdate({ providerId: pId }, { verificationStatus: 'REJECTED', isVerify: false });
                yield (0, emailService_1.sendEmail)({
                    email: user.email,
                    subject: 'EMDR - Application Update',
                    message: `Application rejected: ${rejectionReason}`,
                });
                return { message: 'Provider rejected' };
            }
            throw new AppError_1.default('Invalid action', 400);
        });
    }
    // ──────────────────────────────────────────────────────────
    // STEP 7: Check Onboarding Status
    // ──────────────────────────────────────────────────────────
    getOnboardingStatus(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const pId = new mongoose_1.Types.ObjectId(providerId);
            const [user, profile, doc] = yield Promise.all([
                user_model_1.User.findById(pId).lean(),
                providerProfile_model_1.ProviderProfile.findOne({ providerId: pId }).lean(),
                providerDocument_model_1.ProviderDocument.findOne({ providerId: pId }).lean(),
            ]);
            if (!user)
                throw new AppError_1.default('User not found', 404);
            return {
                userId: user._id,
                email: user.email,
                isEmailVerified: user.isEmailVerified,
                isProviderApproved: user.isProviderApproved || false,
                verificationStatus: (profile === null || profile === void 0 ? void 0 : profile.verificationStatus) || 'PENDING',
                documentStatus: (doc === null || doc === void 0 ? void 0 : doc.documentStatus) || 'not_submitted',
            };
        });
    }
}
exports.default = new ProviderOnboardingService();
