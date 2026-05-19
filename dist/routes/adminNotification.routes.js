"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminNotification_controller_1 = __importDefault(require("../controllers/adminNotification.controller"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router();
// All routes here are admin only
router.use(authenticate_1.authenticate);
router.use((0, requireRole_1.requireRole)([user_model_1.UserRole.ADMIN]));
/**
 * @route GET /api/v1/admin/notifications
 * @desc Get all notifications on platform
 */
router.get('/', adminNotification_controller_1.default.getAllNotifications);
/**
 * @route POST /api/v1/admin/notifications/broadcast
 * @desc Send a mass notification to users
 */
router.post('/broadcast', adminNotification_controller_1.default.broadcastNotification);
/**
 * @route DELETE /api/v1/admin/notifications/:id
 * @desc Delete a specific notification
 */
router.delete('/:id', adminNotification_controller_1.default.deleteNotification);
exports.default = router;
