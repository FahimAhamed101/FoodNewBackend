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
const profile_service_1 = __importDefault(require("../services/profile.service"));
const catchAsync_1 = require("../utils/catchAsync");
class ProfileController {
    constructor() {
        /**
         * Get My Profile
         */
        this.getProfile = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.userId;
            const profile = yield profile_service_1.default.getProfile(userId);
            res.status(200).json({
                success: true,
                data: profile,
            });
        }));
        /**
         * Update My Profile
         */
        this.updateProfile = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.userId;
            const updateData = Object.assign({}, req.body);
            if (req.file) {
                updateData.profilePic = req.file.path;
            }
            const profile = yield profile_service_1.default.updateProfile(userId, updateData);
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: profile,
            });
        }));
        /**
         * Delete My Profile (Soft Delete)
         */
        this.deleteProfile = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.userId;
            yield profile_service_1.default.deleteProfile(userId);
            res.status(200).json({
                success: true,
                message: 'Profile deactivated successfully',
            });
        }));
    }
}
exports.default = new ProfileController();
