"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const providerProfile_model_1 = require("../models/providerProfile.model");
const mongoose_1 = require("mongoose");
const AppError_1 = __importDefault(require("../utils/AppError"));
class ProviderProfileService {
    /**
     * Get Provider Profile
     * Returns profile even if inactive (social style)
     */
    getProfile(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const pId = new mongoose_1.Types.ObjectId(providerId);
            const [profile, reviewStats] = yield Promise.all([
                providerProfile_model_1.ProviderProfile.findOne({ providerId: pId }).lean(),
                Promise.resolve().then(() => __importStar(require('../models/review.model'))).then(({ Review }) => Review.aggregate([
                    { $match: { providerId: pId } },
                    {
                        $group: {
                            _id: null,
                            totalReviews: { $sum: 1 },
                            averageRating: { $avg: '$rating' }
                        }
                    }
                ]))
            ]);
            if (!profile) {
                throw new AppError_1.default('Provider profile not found', 404, 'PROFILE_NOT_FOUND');
            }
            const stats = reviewStats[0] || { totalReviews: 0, averageRating: 0 };
            return Object.assign(Object.assign({}, profile), { totalReviews: stats.totalReviews || 0, AverageReviews: stats.averageRating ? stats.averageRating.toFixed(1) : "0.0", lat: (_a = profile.location) === null || _a === void 0 ? void 0 : _a.lat, lng: (_b = profile.location) === null || _b === void 0 ? void 0 : _b.lng, restaurantAddress: profile.restaurantAddress || 'To be updated' });
        });
    }
    /**
     * Update Provider Profile
     * Works even on inactive profiles
     */
    updateProfile(providerId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const pId = new mongoose_1.Types.ObjectId(providerId);
            const profile = yield providerProfile_model_1.ProviderProfile.findOneAndUpdate({ providerId: pId }, { $set: updateData }, { new: true, runValidators: true }).lean();
            if (!profile) {
                throw new AppError_1.default('Provider profile not found', 404, 'PROFILE_NOT_FOUND');
            }
            // Fetch review stats again to return consistent response
            const stats = yield Promise.resolve().then(() => __importStar(require('../models/review.model'))).then(({ Review }) => Review.aggregate([
                { $match: { providerId: pId } },
                {
                    $group: {
                        _id: null,
                        totalReviews: { $sum: 1 },
                        averageRating: { $avg: '$rating' }
                    }
                }
            ])).then(res => res[0] || { totalReviews: 0, averageRating: 0 });
            return Object.assign(Object.assign({}, profile), { totalReviews: stats.totalReviews || 0, AverageReviews: stats.averageRating ? stats.averageRating.toFixed(1) : "0.0", lat: (_a = profile.location) === null || _a === void 0 ? void 0 : _a.lat, lng: (_b = profile.location) === null || _b === void 0 ? void 0 : _b.lng, restaurantAddress: profile.restaurantAddress || 'To be updated' });
        });
    }
    /**
     * Delete Provider Profile (Soft Delete)
     * Marks as inactive, data stays in database
     */
    deleteProfile(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const pId = new mongoose_1.Types.ObjectId(providerId);
            const profile = yield providerProfile_model_1.ProviderProfile.findOneAndUpdate({ providerId: pId }, { $set: { isActive: false } }, { new: true });
            if (!profile) {
                throw new AppError_1.default('Provider profile not found', 404, 'PROFILE_NOT_FOUND');
            }
            return true;
        });
    }
}
exports.default = new ProviderProfileService();
