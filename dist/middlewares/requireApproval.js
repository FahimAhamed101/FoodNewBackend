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
exports.requireApproval = void 0;
const AppError_1 = __importDefault(require("../utils/AppError"));
const user_model_1 = require("../models/user.model");
const providerProfile_model_1 = require("../models/providerProfile.model");
/**
 * Middleware to restrict access to approved providers.
 * Must be used AFTER the authenticate middleware.
 */
const requireApproval = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return next(new AppError_1.default('Authentication required', 401, 'AUTH_ERROR'));
        }
        // If not a provider, skip approval check (e.g. Admin or Customer)
        if (req.user.role !== user_model_1.UserRole.PROVIDER) {
            return next();
        }
        // Fetch user from DB to get the latest approval status
        const user = yield user_model_1.User.findById(req.user.userId);
        if (!user) {
            return next(new AppError_1.default('User not found', 404, 'USER_NOT_FOUND'));
        }
        if (!user.isProviderApproved) {
            // Backward-compatibility sync:
            // Some legacy admin approval paths marked only ProviderProfile as approved.
            const profile = yield providerProfile_model_1.ProviderProfile.findOne({ providerId: user._id }).select('verificationStatus status isActive');
            const profileIndicatesApproved = (profile === null || profile === void 0 ? void 0 : profile.verificationStatus) === 'APPROVED' &&
                (profile === null || profile === void 0 ? void 0 : profile.status) !== 'BLOCKED' &&
                (profile === null || profile === void 0 ? void 0 : profile.isActive) !== false;
            if (profileIndicatesApproved) {
                user.isProviderApproved = true;
                user.providerApprovedAt = user.providerApprovedAt || new Date();
                user.providerApprovedBy = user.providerApprovedBy || 'approval-sync';
                yield user.save({ validateBeforeSave: false });
                return next();
            }
            return next(new AppError_1.default('Your restaurant application is not yet approved. Please complete your registration and wait for admin approval.', 403, 'PROVIDER_NOT_APPROVED'));
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.requireApproval = requireApproval;
