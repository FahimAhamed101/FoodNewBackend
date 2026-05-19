"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const systemConfig_controller_1 = __importDefault(require("../controllers/systemConfig.controller"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const user_model_1 = require("../models/user.model");
const router = (0, express_1.Router)();
/**
 * PUBLIC ROUTES
 */
router.get('/logo', systemConfig_controller_1.default.getLogo);
router.get('/platform-fee', systemConfig_controller_1.default.getPlatformFee);
router.get('/public', systemConfig_controller_1.default.getPublicSettings);
router.get('/restaurant-dashboard-permissions', systemConfig_controller_1.default.getRestaurantDashboardPermissions);
/**
 * ADMIN ONLY ROUTES
 */
router.use(authenticate_1.authenticate);
router.use((0, requireRole_1.requireRole)([user_model_1.UserRole.ADMIN]));
router.post('/logo', systemConfig_controller_1.default.updateLogo);
router.patch('/logo', systemConfig_controller_1.default.updateLogo);
router.delete('/logo', systemConfig_controller_1.default.deleteLogo);
router.post('/platform-fee', systemConfig_controller_1.default.updatePlatformFee);
router.patch('/platform-fee', systemConfig_controller_1.default.updatePlatformFee);
router.delete('/platform-fee', systemConfig_controller_1.default.deletePlatformFee);
router.patch('/restaurant-dashboard-permissions', systemConfig_controller_1.default.updateRestaurantDashboardPermissions);
exports.default = router;
