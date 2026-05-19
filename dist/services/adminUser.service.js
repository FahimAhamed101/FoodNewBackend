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
const providerProfile_model_1 = require("../models/providerProfile.model");
const food_model_1 = require("../models/food.model");
const AppError_1 = __importDefault(require("../utils/AppError"));
class AdminUserService {
    getUsersByRole(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { role, status, page, limit } = filters;
            const skip = (page - 1) * limit;
            const matchStage = { role };
            if (status && status !== 'all_status') {
                if (status === 'active')
                    matchStage.isActive = true;
                if (status === 'suspended')
                    matchStage.isSuspended = true;
            }
            const profileCollection = role === user_model_1.UserRole.PROVIDER ? 'providerprofiles' : 'profiles';
            const pipeline = [
                { $match: matchStage },
                {
                    $lookup: {
                        from: profileCollection,
                        localField: '_id',
                        foreignField: role === user_model_1.UserRole.PROVIDER ? 'providerId' : 'userId',
                        as: 'profile'
                    }
                },
                { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'foods',
                        localField: '_id',
                        foreignField: 'providerId',
                        as: 'foods'
                    }
                },
                {
                    $lookup: {
                        from: 'reviews',
                        localField: '_id',
                        foreignField: 'providerId',
                        as: 'userReviews'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        providerID: '$_id',
                        fullName: 1,
                        email: 1,
                        status: {
                            $cond: {
                                if: { $eq: ['$isSuspended', true] },
                                then: 'suspended',
                                else: {
                                    $cond: {
                                        if: { $eq: ['$isActive', false] },
                                        then: 'blocked',
                                        else: 'approved'
                                    }
                                }
                            }
                        },
                        createdAt: 1,
                        updatedAt: 1,
                        id: { $ifNull: ['$profile._id', '$_id'] },
                        userId: '$_id',
                        profilePicture: { $ifNull: ['$profile.profilePic', '$profile.profile', '$profilePic', ''] },
                        coverPhoto: { $ifNull: ['$profile.coverPhoto', null] },
                        bio: { $ifNull: ['$profile.bio', ''] },
                        ownersName: { $ifNull: ['$profile.ownersName', null] },
                        phoneNumber: { $ifNull: ['$profile.phone', '$phone', ''] },
                        companyName: { $ifNull: ['$profile.restaurantName', '$profile.companyName', null] },
                        followers: { $ifNull: ['$profile.followers', 0] },
                        reviews: {
                            averageRating: { $ifNull: [{ $avg: '$userReviews.rating' }, 0] },
                            totalReviews: { $size: '$userReviews' }
                        },
                        serviceCategories: { $ifNull: ['$profile.cuisine', '$profile.serviceCategories', []] },
                        totalUpload: {
                            totalService: { $size: '$foods' }
                        },
                        isPayment: { $ifNull: ['$profile.isPayment', false] },
                        facebook: { $ifNull: ['$profile.facebook', ''] },
                        instagram: { $ifNull: ['$profile.instagram', ''] },
                        website: { $ifNull: ['$profile.website', ''] },
                        address: { $ifNull: ['$profile.address', ''] },
                        location: { $ifNull: ['$profile.location', null] },
                        curatedLatitude: { $ifNull: ['$profile.location.lat', null] },
                        curatedLongitude: { $ifNull: ['$profile.location.lng', null] }
                    }
                },
                {
                    $facet: {
                        metadata: [{ $count: 'total' }],
                        data: [
                            { $sort: { createdAt: -1 } },
                            { $skip: skip },
                            { $limit: limit }
                        ]
                    }
                }
            ];
            const result = yield user_model_1.User.aggregate(pipeline);
            const total = ((_a = result[0].metadata[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
            const data = result[0].data;
            return {
                data,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            };
        });
    }
    blockUser(userId, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findByIdAndUpdate(userId, {
                isActive: false,
                isSuspended: true,
                suspendedReason: reason,
                suspendedAt: new Date()
            }, { new: true });
            if (!user)
                throw new AppError_1.default('User not found', 404);
            if (user.role === user_model_1.UserRole.PROVIDER) {
                yield providerProfile_model_1.ProviderProfile.findOneAndUpdate({ providerId: userId }, { status: 'BLOCKED', isActive: false, blockReason: reason });
                yield food_model_1.Food.updateMany({ providerId: userId }, { foodStatus: false });
            }
            return user;
        });
    }
    unblockUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findByIdAndUpdate(userId, {
                isActive: true,
                isSuspended: false,
                $unset: { suspendedReason: 1, suspendedAt: 1 }
            }, { new: true });
            if (!user)
                throw new AppError_1.default('User not found', 404);
            if (user.role === user_model_1.UserRole.PROVIDER) {
                yield providerProfile_model_1.ProviderProfile.findOneAndUpdate({ providerId: userId }, { status: 'ACTIVE', isActive: true, $unset: { blockReason: 1 } });
                yield food_model_1.Food.updateMany({ providerId: userId }, { foodStatus: true });
            }
            return user;
        });
    }
}
exports.default = new AdminUserService();
