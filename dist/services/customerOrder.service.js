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
class CustomerOrderService {
    getCurrentOrders(customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentStatuses = [
                order_model_1.OrderStatus.PENDING,
                order_model_1.OrderStatus.PREPARING,
                order_model_1.OrderStatus.READY_FOR_PICKUP,
                order_model_1.OrderStatus.PICKED_UP
            ];
            const orders = yield order_model_1.Order.find({
                customerId: new mongoose_1.Types.ObjectId(customerId),
                status: { $in: currentStatuses }
            })
                .sort({ createdAt: -1 })
                .lean();
            if (!orders || orders.length === 0) {
                throw new AppError_1.default('No current orders found', 404, 'ORDERS_NOT_FOUND');
            }
            // Store raw IDs before they are potentially replaced by 'null' during population
            const ordersWithRawIds = orders.map(o => (Object.assign(Object.assign({}, o), { _tempProviderId: o.providerId })));
            const populatedOrders = yield order_model_1.Order.populate(ordersWithRawIds, {
                path: 'providerId',
                select: 'fullName email'
            });
            // If population returned null, restore the original ID
            const formattedOrders = populatedOrders.map(order => (Object.assign(Object.assign({}, order), { providerInfo: order.providerId, providerId: order.providerId ? order.providerId._id || order.providerId : order._tempProviderId, _tempProviderId: undefined // Cleanup
             })));
            return formattedOrders;
        });
    }
    getPreviousOrders(customerId, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const previousStatuses = [
                order_model_1.OrderStatus.COMPLETED,
                order_model_1.OrderStatus.CANCELLED
            ];
            const sanitizedLimit = Math.min(limit, 10);
            const skip = (page - 1) * sanitizedLimit;
            const [orders, total] = yield Promise.all([
                order_model_1.Order.find({
                    customerId: new mongoose_1.Types.ObjectId(customerId),
                    status: { $in: previousStatuses }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(sanitizedLimit)
                    .lean(),
                order_model_1.Order.countDocuments({
                    customerId: new mongoose_1.Types.ObjectId(customerId),
                    status: { $in: previousStatuses }
                })
            ]);
            if (!orders || orders.length === 0) {
                throw new AppError_1.default('No previous orders found', 404, 'ORDERS_NOT_FOUND');
            }
            // Store raw IDs before they are potentially replaced by 'null' during population
            const ordersWithRawIds = orders.map(o => (Object.assign(Object.assign({}, o), { _tempProviderId: o.providerId })));
            const populatedOrders = yield order_model_1.Order.populate(ordersWithRawIds, {
                path: 'providerId',
                select: 'fullName email'
            });
            // If population returned null, restore the original ID
            const formattedOrders = populatedOrders.map(order => (Object.assign(Object.assign({}, order), { providerInfo: order.providerId, providerId: order.providerId ? order.providerId._id || order.providerId : order._tempProviderId, _tempProviderId: undefined })));
            return {
                orders: formattedOrders,
                total,
                page,
                limit: sanitizedLimit
            };
        });
    }
    cleanupOldOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            const retentionPeriod = 90;
            const cleanupDate = new Date();
            cleanupDate.setDate(cleanupDate.getDate() - retentionPeriod);
            const result = yield order_model_1.Order.deleteMany({
                status: { $in: [order_model_1.OrderStatus.COMPLETED, order_model_1.OrderStatus.CANCELLED] },
                createdAt: { $lt: cleanupDate }
            });
            console.log(`[CLEANUP] Deleted ${result.deletedCount} old orders.`);
            return result.deletedCount;
        });
    }
}
exports.default = new CustomerOrderService();
