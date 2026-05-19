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
const providerProfile_service_1 = __importDefault(require("../services/providerProfile.service"));
const catchAsync_1 = require("../utils/catchAsync");
class ProviderProfileController {
    constructor() {
        /**
         * Get My Provider Profile
         */
        this.getProfile = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const profile = yield providerProfile_service_1.default.getProfile(providerId);
            res.status(200).json({
                success: true,
                data: profile,
            });
        }));
        /**
         * Update My Provider Profile
         */
        this.updateProfile = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const updateData = Object.assign({}, req.body);
            if (req.file) {
                updateData.profile = req.file.path;
            }
            const profile = yield providerProfile_service_1.default.updateProfile(providerId, updateData);
            res.status(200).json({
                success: true,
                message: 'Provider profile updated successfully',
                data: profile,
            });
        }));
        /**
         * Delete My Provider Profile (Soft Delete)
         */
        this.deleteProfile = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            yield providerProfile_service_1.default.deleteProfile(providerId);
            res.status(200).json({
                success: true,
                message: 'Provider profile deactivated successfully',
            });
        }));
    }
}
exports.default = new ProviderProfileController();
