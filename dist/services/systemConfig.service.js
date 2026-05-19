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
Object.defineProperty(exports, "__esModule", { value: true });
const systemConfig_model_1 = require("../models/systemConfig.model");
class SystemConfigService {
    /**
     * Get a setting by key
     */
    getSetting(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = yield systemConfig_model_1.SystemConfig.findOne({ key });
            return config ? config.value : null;
        });
    }
    /**
     * Update or create a setting
     */
    updateSetting(key, value, description) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = yield systemConfig_model_1.SystemConfig.findOneAndUpdate({ key }, { $set: { value, description } }, { upsert: true, new: true, runValidators: true });
            return config;
        });
    }
    /**
     * Specific helper for Logo Management
     */
    getAppLogo() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getSetting('app_logo');
        });
    }
    updateAppLogo(logoUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.updateSetting('app_logo', logoUrl, 'Main application logo used in headers, emails, and dashboard.');
        });
    }
    deleteAppLogo() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield systemConfig_model_1.SystemConfig.findOneAndDelete({ key: 'app_logo' });
        });
    }
    /**
     * Specific helper for Platform Fees
     */
    getPlatformFeeConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            const fee = yield this.getSetting('platform_fee');
            // Default to { type: 'fixed', value: 0 } if not set
            return fee || { type: 'fixed', value: 0 };
        });
    }
    updatePlatformFee(type, value) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.updateSetting('platform_fee', { type, value }, 'Global platform fee applied to every order.');
        });
    }
    deletePlatformFee() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield systemConfig_model_1.SystemConfig.findOneAndDelete({ key: 'platform_fee' });
        });
    }
    /**
     * Restaurant Dashboard Permissions
     */
    getRestaurantDashboardPermissions() {
        return __awaiter(this, void 0, void 0, function* () {
            const permissions = yield this.getSetting('restaurant_dashboard_permissions');
            // Default permissions if not set
            return permissions || { showUserDistributionByCity: true };
        });
    }
    updateRestaurantDashboardPermissions(permissions) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.updateSetting('restaurant_dashboard_permissions', permissions, 'Controls visibility of specific data cards in the restaurant owner dashboard.');
        });
    }
    /**
     * Get all public settings
     */
    getAllPublicSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            const configs = yield systemConfig_model_1.SystemConfig.find({
                key: { $in: ['app_logo', 'app_name', 'primary_color'] }
            });
            const settings = {};
            configs.forEach(c => {
                settings[c.key] = c.value;
            });
            return settings;
        });
    }
}
exports.default = new SystemConfigService();
