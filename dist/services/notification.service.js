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
const notification_model_1 = require("../models/notification.model");
const user_model_1 = require("../models/user.model");
const order_model_1 = require("../models/order.model");
const AppError_1 = __importDefault(require("../utils/AppError"));
const mongoose_1 = require("mongoose");
class NotificationService {
    createNotification(userId, userRole, orderId, orderStatus, title, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield notification_model_1.Notification.create({
                    userId,
                    userRole,
                    orderId,
                    orderStatus,
                    title,
                    message,
                });
            }
            catch (error) {
                if (error.code === 11000) {
                    return null;
                }
                throw error;
            }
        });
    }
    getUserNotifications(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const notifications = yield notification_model_1.Notification.find({ userId: new mongoose_1.Types.ObjectId(userId) })
                .sort({ createdAt: -1 })
                .lean();
            const formattedNotifications = notifications.map((n) => ({
                notificationId: n._id,
                userId: n.userId,
                userRole: n.userRole,
                orderId: n.orderId,
                title: n.title,
                message: n.message,
                status: n.createdAt > twentyFourHoursAgo ? 'NEW' : 'OLD',
                isRead: n.isRead,
                createdAt: n.createdAt,
            }));
            const newNotifications = formattedNotifications.filter((n) => n.status === 'NEW');
            const oldNotifications = formattedNotifications.filter((n) => n.status === 'OLD');
            return {
                newNotifications,
                oldNotifications,
            };
        });
    }
    markAsRead(notificationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const notification = yield notification_model_1.Notification.findOne({
                _id: new mongoose_1.Types.ObjectId(notificationId),
                userId: new mongoose_1.Types.ObjectId(userId),
            });
            if (!notification) {
                throw new AppError_1.default('Notification not found or access denied', 404, 'NOTIFICATION_ACCESS_ERROR');
            }
            notification.isRead = true;
            yield notification.save();
            return notification;
        });
    }
    getNotificationDetails(status, orderId, role) {
        const messages = {
            [order_model_1.OrderStatus.PENDING]: {
                title: 'New Order',
                customer: `Your order ${orderId} has been placed successfully.`,
                provider: `You have received a new order ${orderId}.`,
            },
            [order_model_1.OrderStatus.PREPARING]: {
                title: 'Order Preparing',
                customer: `Your order ${orderId} is now being prepared.`,
                provider: `You started preparing order ${orderId}.`,
            },
            [order_model_1.OrderStatus.READY_FOR_PICKUP]: {
                title: 'Order Ready',
                customer: `Your order ${orderId} is ready for pickup!`,
                provider: `Order ${orderId} is marked as ready for pickup.`,
            },
            [order_model_1.OrderStatus.PICKED_UP]: {
                title: 'Order Picked Up',
                customer: `Your order ${orderId} has been picked up. Enjoy your meal!`,
                provider: `Order ${orderId} has been picked up by the customer/courier.`,
            },
            [order_model_1.OrderStatus.COMPLETED]: {
                title: 'Order Completed',
                customer: `Your order ${orderId} has been completed. Thank you!`,
                provider: `Order ${orderId} has been completed.`,
            },
            [order_model_1.OrderStatus.CANCELLED]: {
                title: 'Order Cancelled',
                customer: `Your order ${orderId} has been cancelled.`,
                provider: `Order ${orderId} has been cancelled.`,
            },
        };
        const details = messages[status];
        return {
            title: details.title,
            message: role === user_model_1.UserRole.CUSTOMER ? details.customer : details.provider,
        };
    }
    /**
     * Admin: Get all notifications on the platform
     */
    getAllNotifications() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 20) {
            const skip = (page - 1) * limit;
            const [notifications, total] = yield Promise.all([
                notification_model_1.Notification.find()
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('userId', 'fullName email role')
                    .lean(),
                notification_model_1.Notification.countDocuments()
            ]);
            return {
                notifications,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            };
        });
    }
    /**
     * Admin: Broadcast notification to specific roles or all users
     */
    broadcastNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { title, message, targetRole, type } = data;
            const query = targetRole ? { role: targetRole } : {};
            const users = yield Promise.resolve().then(() => __importStar(require('../models/user.model'))).then(m => m.User.find(query).select('_id role'));
            const notifications = users.map(user => ({
                userId: user._id,
                userRole: user.role,
                type: type || 'SYSTEM',
                title,
                message,
                isRead: false
            }));
            return yield notification_model_1.Notification.insertMany(notifications);
        });
    }
    /**
     * Admin: Delete a notification
     */
    deleteNotification(notificationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield notification_model_1.Notification.findByIdAndDelete(notificationId);
            if (!result)
                throw new AppError_1.default('Notification not found', 404);
            return true;
        });
    }
}
exports.default = new NotificationService();
