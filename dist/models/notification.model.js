"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = exports.NotificationType = void 0;
const mongoose_1 = require("mongoose");
const user_model_1 = require("./user.model");
const order_model_1 = require("./order.model"); // Kept for backward compat
var NotificationType;
(function (NotificationType) {
    NotificationType["ORDER"] = "ORDER";
    NotificationType["MESSAGE"] = "MESSAGE";
    NotificationType["SYSTEM"] = "SYSTEM";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
const notificationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: Object.values(NotificationType),
        default: NotificationType.SYSTEM,
        index: true
    },
    // Made optional
    userRole: {
        type: String,
        enum: Object.values(user_model_1.UserRole),
    },
    orderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Order',
    },
    orderStatus: {
        type: String,
        enum: Object.values(order_model_1.OrderStatus),
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed // Flexible storage
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Indexes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, orderId: 1, orderStatus: 1 }, { sparse: true });
exports.Notification = (0, mongoose_1.model)('Notification', notificationSchema);
