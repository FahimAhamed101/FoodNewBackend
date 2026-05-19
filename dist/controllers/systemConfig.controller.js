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
const catchAsync_1 = require("../utils/catchAsync");
const systemConfig_service_1 = __importDefault(require("../services/systemConfig.service"));
const AppError_1 = __importDefault(require("../utils/AppError"));
class SystemConfigController {
    constructor() {
        /**
         * GET /api/v1/config/logo
         * Publicly accessible logo URL
         */
        this.getLogo = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const logo = yield systemConfig_service_1.default.getAppLogo();
            res.status(200).json({
                success: true,
                logo: logo || ''
            });
        }));
        /**
         * POST /api/v1/admin/config/logo
         * Admin only: Update logo
         */
        this.updateLogo = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { logoUrl } = req.body;
            if (!logoUrl) {
                throw new AppError_1.default('Logo URL is required', 400);
            }
            const config = yield systemConfig_service_1.default.updateAppLogo(logoUrl);
            res.status(200).json({
                success: true,
                message: 'App logo updated successfully',
                data: config
            });
        }));
        /**
         * DELETE /api/v1/admin/config/logo
         */
        this.deleteLogo = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            yield systemConfig_service_1.default.deleteAppLogo();
            res.status(200).json({
                success: true,
                message: 'App logo deleted successfully'
            });
        }));
        /**
         * GET /api/v1/config/platform-fee
         */
        this.getPlatformFee = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const fee = yield systemConfig_service_1.default.getPlatformFeeConfig();
            res.status(200).json({
                success: true,
                data: fee
            });
        }));
        this.updatePlatformFee = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { type, value } = req.body;
            if (!type || value === undefined) {
                throw new AppError_1.default('Fee type (fixed|percentage) and value are required', 400);
            }
            const config = yield systemConfig_service_1.default.updatePlatformFee(type, value);
            res.status(200).json({
                success: true,
                message: 'Platform fee updated successfully',
                data: config
            });
        }));
        /**
         * DELETE /api/v1/admin/config/platform-fee
         */
        this.deletePlatformFee = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            yield systemConfig_service_1.default.deletePlatformFee();
            res.status(200).json({
                success: true,
                message: 'Platform fee setting deleted successfully'
            });
        }));
        /**
         * GET /api/v1/config/restaurant-dashboard-permissions
         */
        this.getRestaurantDashboardPermissions = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const permissions = yield systemConfig_service_1.default.getRestaurantDashboardPermissions();
            res.status(200).json({
                success: true,
                data: permissions
            });
        }));
        /**
         * PATCH /api/v1/admin/config/restaurant-dashboard-permissions
         */
        this.updateRestaurantDashboardPermissions = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { showUserDistributionByCity } = req.body;
            if (showUserDistributionByCity === undefined) {
                throw new AppError_1.default('showUserDistributionByCity field is required', 400);
            }
            const config = yield systemConfig_service_1.default.updateRestaurantDashboardPermissions({
                showUserDistributionByCity
            });
            res.status(200).json({
                success: true,
                message: 'Restaurant dashboard permissions updated successfully',
                data: config
            });
        }));
        /**
         * GET /api/v1/config/public
         * Get all public settings
         */
        this.getPublicSettings = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const settings = yield systemConfig_service_1.default.getAllPublicSettings();
            res.status(200).json({
                success: true,
                data: settings
            });
        }));
    }
}
exports.default = new SystemConfigController();
