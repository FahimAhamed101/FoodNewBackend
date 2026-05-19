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
const notification_service_1 = __importDefault(require("../services/notification.service"));
const catchAsync_1 = require("../utils/catchAsync");
class AdminNotificationController {
    constructor() {
        /**
         * GET /api/v1/admin/notifications
         */
        this.getAllNotifications = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const data = yield notification_service_1.default.getAllNotifications(page, limit);
            res.status(200).json({
                success: true,
                data
            });
        }));
        /**
         * POST /api/v1/admin/notifications/broadcast
         */
        this.broadcastNotification = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { title, message, targetRole, type } = req.body;
            const notifications = yield notification_service_1.default.broadcastNotification({
                title,
                message,
                targetRole,
                type
            });
            res.status(201).json({
                success: true,
                message: `Notification broadcasted to ${notifications.length} users`,
                count: notifications.length
            });
        }));
        /**
         * DELETE /api/v1/admin/notifications/:id
         */
        this.deleteNotification = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            yield notification_service_1.default.deleteNotification(id);
            res.status(200).json({
                success: true,
                message: 'Notification deleted successfully'
            });
        }));
    }
}
exports.default = new AdminNotificationController();
