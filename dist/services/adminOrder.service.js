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
const mongoose_1 = require("mongoose");
const order_model_1 = require("../models/order.model");
const providerProfile_model_1 = require("../models/providerProfile.model");
const AppError_1 = __importDefault(require("../utils/AppError"));
class AdminOrderService {
    /**
     * Get full order details for Admin
     *
     * @param providerId - The provider's ID (optional)
     * @param orderId - The Order ID (custom string ID, e.g. ORD-001)
     */
    getOrderDetails(providerId, orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Find the order
            const query = { orderId: orderId };
            if (providerId) {
                query.providerId = new mongoose_1.Types.ObjectId(providerId);
            }
            const order = yield order_model_1.Order.findOne(query)
                .populate('customerId', 'fullName email phone')
                .populate('items.foodId', 'title price image');
            if (!order) {
                throw new AppError_1.default('Order not found', 404);
            }
            // 2. Get Restaurant Info
            const actualProviderId = order.providerId;
            const providerProfile = yield providerProfile_model_1.ProviderProfile.findOne({ providerId: actualProviderId });
            const restaurantName = (providerProfile === null || providerProfile === void 0 ? void 0 : providerProfile.restaurantName) || 'Unknown Restaurant';
            const restaurantAddress = `${(providerProfile === null || providerProfile === void 0 ? void 0 : providerProfile.restaurantAddress) || ''}, ${(providerProfile === null || providerProfile === void 0 ? void 0 : providerProfile.city) || ''}, ${(providerProfile === null || providerProfile === void 0 ? void 0 : providerProfile.state) || ''}, ${(providerProfile === null || providerProfile === void 0 ? void 0 : providerProfile.zipCode) || ''}`;
            // 3. Format Items
            const formattedItems = order.items.map((item) => {
                var _a;
                return ({
                    name: ((_a = item.foodId) === null || _a === void 0 ? void 0 : _a.title) || 'Unknown Item',
                    quantity: item.quantity,
                    pricePerItem: item.price,
                    totalPrice: item.quantity * item.price
                });
            });
            // 4. Calculate Pricing Breakdown
            // Use the stored values from order (already calculated correctly during order creation)
            const subtotal = order.subtotal || 0;
            const platformFee = order.platformFee || 0;
            const stateTax = order.stateTax || 0;
            const donationAmount = order.donationAmount || 0;
            const total = order.totalPrice;
            // 5. Format Timeline
            // If orderStatusHistory exists, use it. Else fallback to createdAt/updatedAt
            let timeline = [];
            if (order.orderStatusHistory && order.orderStatusHistory.length > 0) {
                timeline = order.orderStatusHistory.map(history => ({
                    status: history.status,
                    time: history.timestamp
                }));
            }
            else {
                // Fallback if history tracking wasn't active
                timeline.push({ status: 'Order Placed', time: order.createdAt });
                if (order.status === order_model_1.OrderStatus.COMPLETED) {
                    timeline.push({ status: 'Completed', time: order.updatedAt });
                }
            }
            // Sort timeline
            timeline.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
            // 6. Construct Response
            const customer = order.customerId;
            return {
                orderId: order.orderId,
                status: order.status,
                createdAt: order.createdAt,
                items: formattedItems,
                pricing: {
                    subtotal: parseFloat(subtotal.toFixed(2)),
                    stateTax: parseFloat(stateTax.toFixed(2)),
                    platformFee: parseFloat(platformFee.toFixed(2)),
                    donationAmount: parseFloat(donationAmount.toFixed(2)),
                    total: parseFloat(total.toFixed(2))
                },
                customer: {
                    name: (customer === null || customer === void 0 ? void 0 : customer.fullName) || 'Unknown',
                    email: (customer === null || customer === void 0 ? void 0 : customer.email) || 'Unknown',
                    phone: (customer === null || customer === void 0 ? void 0 : customer.phone) || 'Unknown'
                },
                restaurant: {
                    name: restaurantName,
                    address: restaurantAddress.replace(/^, , , $/, 'Address not available'), // Cleanup empty address
                    providerId: actualProviderId.toString()
                },
                timeline
            };
        });
    }
}
exports.default = new AdminOrderService();
