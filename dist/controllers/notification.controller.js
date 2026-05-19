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
const AppError_1 = __importDefault(require("../utils/AppError"));
class NotificationController {
    constructor() {
        this.getNotifications = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.userId;
            const data = yield notification_service_1.default.getUserNotifications(userId);
            res.status(200).json({
                success: true,
                data,
            });
        }));
        this.markAsRead = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.userId;
            const { id } = req.params;
            if (!id) {
                throw new AppError_1.default('Notification ID is required', 400, 'INVALID_REQUEST');
            }
            const notification = yield notification_service_1.default.markAsRead(id, userId);
            res.status(200).json({
                success: true,
                message: 'Notification marked as read',
                data: notification,
            });
        }));
    }
}
exports.default = new NotificationController();
