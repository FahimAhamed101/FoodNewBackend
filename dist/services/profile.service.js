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
const profile_model_1 = require("../models/profile.model");
const providerProfile_model_1 = require("../models/providerProfile.model");
const user_model_1 = require("../models/user.model");
const AppError_1 = __importDefault(require("../utils/AppError"));
const mongoose_1 = require("mongoose");
class ProfileService {
    getProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Fetch base user info
            const user = yield user_model_1.User.findById(userId).lean();
            if (!user)
                throw new AppError_1.default('User not found', 404, 'USER_NOT_FOUND');
            let profile = yield profile_model_1.Profile.findOne({
                userId: new mongoose_1.Types.ObjectId(userId)
            }).lean();
            if (!profile) {
                profile = yield providerProfile_model_1.ProviderProfile.findOne({
                    providerId: new mongoose_1.Types.ObjectId(userId)
                }).lean();
            }
            if (!profile) {
                throw new AppError_1.default('Profile not found', 404, 'PROFILE_NOT_FOUND');
            }
            // Map and merge for dashboard
            return Object.assign({ name: profile.name || user.fullName, Role: user.role, Email: user.email, PhoneNumber: profile.phone || profile.PhoneNumber || '', Boi: profile.bio || profile.Boi || '', JoinedDate: user.createdAt, address: profile.address || '' }, profile // Keep raw profile data for other fields
            );
        });
    }
    updateProfile(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Map custom fields to standard fields
            const updateObj = Object.assign({}, data);
            if (data.PhoneNumber)
                updateObj.phone = data.PhoneNumber;
            if (data.Boi)
                updateObj.bio = data.Boi;
            // Also update User model if relevant fields are passed
            if (data.name) {
                yield user_model_1.User.findByIdAndUpdate(userId, { fullName: data.name });
            }
            const profile = yield profile_model_1.Profile.findOneAndUpdate({ userId: new mongoose_1.Types.ObjectId(userId) }, { $set: updateObj }, { new: true, runValidators: true }).lean();
            if (!profile) {
                throw new AppError_1.default('Profile not found', 404, 'PROFILE_NOT_FOUND');
            }
            return this.getProfile(userId);
        });
    }
    deleteProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const profile = yield profile_model_1.Profile.findOneAndUpdate({ userId: new mongoose_1.Types.ObjectId(userId) }, { $set: { isActive: false } }, { new: true });
            if (!profile) {
                throw new AppError_1.default('Profile not found', 404, 'PROFILE_NOT_FOUND');
            }
            return true;
        });
    }
}
exports.default = new ProfileService();
