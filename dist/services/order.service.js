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
const order_model_1 = require("../models/order.model");
const mongoose_1 = require("mongoose");
const AppError_1 = __importDefault(require("../utils/AppError"));
const notification_service_1 = __importDefault(require("./notification.service"));
const user_model_1 = require("../models/user.model");
const systemConfig_service_1 = __importDefault(require("./systemConfig.service"));
const profile_model_1 = require("../models/profile.model");
const state_model_1 = require("../models/state.model");
class OrderService {
    createOrder(customerId, orderData) {
        return __awaiter(this, void 0, void 0, function* () {
            const donationAmount = this.roundMoney(orderData.donationAmount || 0);
            // Fetch platform fee config
            const feeConfig = yield systemConfig_service_1.default.getPlatformFeeConfig();
            const feeValue = feeConfig.value || 0;
            // Calculate subtotal and individual platform fees
            let subtotal = 0;
            let totalPlatformFee = 0;
            const itemsWithFees = orderData.items.map(item => {
                const itemSubtotal = item.price * item.quantity;
                subtotal += itemSubtotal;
                let itemPlatformFee = 0;
                if (feeConfig.type === 'fixed') {
                    // Fixed fee per unit quantity
                    itemPlatformFee = feeValue * item.quantity;
                }
                else if (feeConfig.type === 'percentage') {
                    // Percentage fee on this item's subtotal
                    itemPlatformFee = (itemSubtotal * feeValue) / 100;
                }
                totalPlatformFee += itemPlatformFee;
                return Object.assign(Object.assign({}, item), { foodId: new mongoose_1.Types.ObjectId(item.foodId), platformFee: parseFloat(itemPlatformFee.toFixed(2)) });
            });
            // Get customer's state for tax calculation
            const customerProfile = yield profile_model_1.Profile.findOne({ userId: new mongoose_1.Types.ObjectId(customerId) });
            let stateTax = 0;
            let customerState = '';
            if (customerProfile && customerProfile.state) {
                customerState = customerProfile.state;
                const stateData = yield state_model_1.State.findOne({
                    $or: [
                        { code: customerProfile.state.toUpperCase() },
                        { name: new RegExp(`^${customerProfile.state}$`, 'i') }
                    ],
                    isActive: true
                });
                if (stateData && stateData.tax) {
                    // State tax is applied once per order on subtotal
                    stateTax = (subtotal * stateData.tax) / 100;
                }
            }
            // Calculate final total
            const totalPrice = subtotal + totalPlatformFee + stateTax + donationAmount;
            const order = yield order_model_1.Order.create({
                customerId: new mongoose_1.Types.ObjectId(customerId),
                providerId: new mongoose_1.Types.ObjectId(orderData.providerId),
                items: itemsWithFees,
                subtotal: parseFloat(subtotal.toFixed(2)),
                platformFee: parseFloat(totalPlatformFee.toFixed(2)),
                stateTax: parseFloat(stateTax.toFixed(2)),
                donationAmount,
                isDonation: !!orderData.isDonation,
                totalPrice: parseFloat(totalPrice.toFixed(2)),
                state: customerState,
                status: order_model_1.OrderStatus.PENDING,
                paymentMethod: orderData.paymentMethod,
                logisticsType: orderData.logisticsType,
                orderId: `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            });
            const { title: cTitle, message: cMessage } = notification_service_1.default.getNotificationDetails(order_model_1.OrderStatus.PENDING, order.orderId, user_model_1.UserRole.CUSTOMER);
            yield notification_service_1.default.createNotification(order.customerId, user_model_1.UserRole.CUSTOMER, order._id, order_model_1.OrderStatus.PENDING, cTitle, cMessage);
            const { title: pTitle, message: pMessage } = notification_service_1.default.getNotificationDetails(order_model_1.OrderStatus.PENDING, order.orderId, user_model_1.UserRole.PROVIDER);
            yield notification_service_1.default.createNotification(order.providerId, user_model_1.UserRole.PROVIDER, order._id, order_model_1.OrderStatus.PENDING, pTitle, pMessage);
            return order;
        });
    }
    roundMoney(value) {
        return Number.isFinite(value) ? parseFloat(value.toFixed(2)) : 0;
    }
    updateStatus(orderId, providerId, newStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield order_model_1.Order.findOne({
                $or: [
                    { orderId: orderId },
                    { _id: mongoose_1.Types.ObjectId.isValid(orderId) ? new mongoose_1.Types.ObjectId(orderId) : undefined }
                ].filter(q => q._id !== undefined || q.orderId)
            });
            if (!order) {
                throw new AppError_1.default('Order not found', 404, 'NOT_FOUND_ERROR');
            }
            if (order.providerId.toString() !== providerId) {
                throw new AppError_1.default(`Access denied. This order belongs to provider ID: ${order.providerId}. You are logged in as: ${providerId}`, 403, 'ACCESS_DENIED');
            }
            // Idempotency: If already in the target status, return success early
            if (order.status === newStatus) {
                return order;
            }
            switch (newStatus) {
                case order_model_1.OrderStatus.PREPARING:
                    if (order.status !== order_model_1.OrderStatus.PENDING) {
                        throw new AppError_1.default(`Order must be Pending to move to Preparing (Current status: ${order.status})`, 400, 'INVALID_ORDER_STATUS');
                    }
                    break;
                case order_model_1.OrderStatus.READY_FOR_PICKUP:
                    if (order.status !== order_model_1.OrderStatus.PREPARING) {
                        throw new AppError_1.default(`Order must be Preparing to move to Ready for Pickup (Current status: ${order.status})`, 400, 'INVALID_ORDER_STATUS');
                    }
                    break;
                case order_model_1.OrderStatus.PICKED_UP:
                    if (order.status !== order_model_1.OrderStatus.READY_FOR_PICKUP) {
                        throw new AppError_1.default(`Order must be Ready for Pickup to move to Picked Up (Current status: ${order.status})`, 400, 'INVALID_ORDER_STATUS');
                    }
                    break;
                case order_model_1.OrderStatus.COMPLETED:
                    if (order.status !== order_model_1.OrderStatus.PICKED_UP && order.status !== order_model_1.OrderStatus.READY_FOR_PICKUP) {
                        throw new AppError_1.default(`Order must be Ready for Pickup or Picked Up to move to Completed (Current status: ${order.status})`, 400, 'INVALID_ORDER_STATUS');
                    }
                    break;
                default:
                    throw new AppError_1.default('Invalid status update via this endpoint. Use cancel for cancellations.', 400, 'INVALID_ORDER_STATUS');
            }
            order.status = newStatus;
            yield order.save();
            const { title: cTitle, message: cMessage } = notification_service_1.default.getNotificationDetails(newStatus, order.orderId, user_model_1.UserRole.CUSTOMER);
            yield notification_service_1.default.createNotification(order.customerId, user_model_1.UserRole.CUSTOMER, order._id, newStatus, cTitle, cMessage);
            const { title: pTitle, message: pMessage } = notification_service_1.default.getNotificationDetails(newStatus, order.orderId, user_model_1.UserRole.PROVIDER);
            yield notification_service_1.default.createNotification(order.providerId, user_model_1.UserRole.PROVIDER, order._id, newStatus, pTitle, pMessage);
            return order;
        });
    }
    cancelOrder(orderId, userId, role, cancellationReason) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield order_model_1.Order.findOne({ orderId });
            if (!order) {
                throw new AppError_1.default('Order not found', 404, 'NOT_FOUND_ERROR');
            }
            if (role === 'CUSTOMER') {
                if (order.customerId.toString() !== userId) {
                    throw new AppError_1.default('Not authorized', 403, 'ROLE_ERROR');
                }
                if (order.status !== order_model_1.OrderStatus.PENDING) {
                    throw new AppError_1.default('Customer can only cancel Pending orders', 400, 'INVALID_ORDER_STATUS');
                }
            }
            else if (role === 'PROVIDER') {
                if (order.providerId.toString() !== userId) {
                    throw new AppError_1.default('Not authorized', 403, 'ROLE_ERROR');
                }
                if (order.status !== order_model_1.OrderStatus.PREPARING) {
                    throw new AppError_1.default('Provider can only cancel Preparing orders', 400, 'INVALID_ORDER_STATUS');
                }
            }
            else {
                throw new AppError_1.default('Invalid role', 403, 'ROLE_ERROR');
            }
            order.status = order_model_1.OrderStatus.CANCELLED;
            if (cancellationReason) {
                order.cancellationReason = cancellationReason;
            }
            yield order.save();
            const { title: cTitle, message: cMessage } = notification_service_1.default.getNotificationDetails(order_model_1.OrderStatus.CANCELLED, order.orderId, user_model_1.UserRole.CUSTOMER);
            yield notification_service_1.default.createNotification(order.customerId, user_model_1.UserRole.CUSTOMER, order._id, order_model_1.OrderStatus.CANCELLED, cTitle, cMessage);
            const { title: pTitle, message: pMessage } = notification_service_1.default.getNotificationDetails(order_model_1.OrderStatus.CANCELLED, order.orderId, user_model_1.UserRole.PROVIDER);
            yield notification_service_1.default.createNotification(order.providerId, user_model_1.UserRole.PROVIDER, order._id, order_model_1.OrderStatus.CANCELLED, pTitle, pMessage);
            return order;
        });
    }
    getOrderById(orderId, userId, role) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield order_model_1.Order.findOne({
                $or: [
                    { orderId: orderId },
                    { _id: mongoose_1.Types.ObjectId.isValid(orderId) ? new mongoose_1.Types.ObjectId(orderId) : undefined }
                ].filter(q => q._id !== undefined || q.orderId)
            }).populate('customerId', 'fullName email phone phoneNumber profilePic googlePicture')
                .populate('providerId', 'fullName email')
                .populate('items.foodId', 'name image');
            if (!order) {
                throw new AppError_1.default('Order not found', 404, 'NOT_FOUND_ERROR');
            }
            if (role === 'CUSTOMER' && order.customerId._id.toString() !== userId) {
                throw new AppError_1.default('Not authorized to view this order', 403, 'ROLE_ERROR');
            }
            if (role === 'PROVIDER' && order.providerId._id.toString() !== userId) {
                throw new AppError_1.default('Not authorized to view this order', 403, 'ROLE_ERROR');
            }
            const customer = order.customerId;
            if (customer === null || customer === void 0 ? void 0 : customer._id) {
                const customerProfile = yield profile_model_1.Profile.findOne({ userId: customer._id })
                    .select('profilePic avatar')
                    .lean();
                const resolvedAvatar = (customer === null || customer === void 0 ? void 0 : customer.profilePic) ||
                    (customer === null || customer === void 0 ? void 0 : customer.googlePicture) ||
                    (customerProfile === null || customerProfile === void 0 ? void 0 : customerProfile.profilePic) ||
                    (customerProfile === null || customerProfile === void 0 ? void 0 : customerProfile.avatar) ||
                    '';
                customer.profilePic = resolvedAvatar;
                customer.avatar = resolvedAvatar;
            }
            return order;
        });
    }
    getOrders(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { status, orderId, customerName, providerId, customerId, page = 1, limit = 10 } = filters;
            const query = {};
            if (providerId)
                query.providerId = new mongoose_1.Types.ObjectId(providerId);
            if (customerId)
                query.customerId = new mongoose_1.Types.ObjectId(customerId);
            if (status)
                query.status = status;
            if (orderId)
                query.orderId = orderId;
            const pipeline = [
                { $match: query },
                { $sort: { createdAt: -1 } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'customerId',
                        foreignField: '_id',
                        as: 'customerInfo',
                    },
                },
                { $unwind: '$customerInfo' },
            ];
            if (customerName) {
                const escapedName = customerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                pipeline.push({
                    $match: {
                        'customerInfo.fullName': { $regex: new RegExp(escapedName, 'i') },
                    },
                });
            }
            pipeline.push({
                $project: {
                    _id: 1,
                    orderId: 1,
                    customerName: '$customerInfo.fullName',
                    logisticsType: 1,
                    donationAmount: 1,
                    totalPrice: 1,
                    status: 1,
                    createdAt: 1,
                },
            });
            const skip = (Number(page) - 1) * Number(limit);
            const facetPipeline = [
                ...pipeline,
                {
                    $facet: {
                        metadata: [{ $count: 'total' }],
                        data: [{ $skip: skip }, { $limit: Number(limit) }],
                    },
                },
            ];
            const result = yield order_model_1.Order.aggregate(facetPipeline);
            const total = ((_a = result[0].metadata[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
            const orders = result[0].data;
            return {
                orders,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit)),
                },
            };
        });
    }
    getProviderOrders(providerId, filters) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getOrders(Object.assign(Object.assign({}, filters), { providerId }));
        });
    }
}
exports.default = new OrderService();
