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
const paymentMethod_model_1 = require("../models/paymentMethod.model");
const mongoose_1 = require("mongoose");
const AppError_1 = __importDefault(require("../utils/AppError"));
class AdminPaymentMethodService {
    /**
     * Get all payment methods platform-wide (paginated)
     */
    getAllPaymentMethods() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10, search) {
            const query = {};
            if (search) {
                query.$or = [
                    { last4: { $regex: search, $options: 'i' } },
                    { cardholderName: { $regex: search, $options: 'i' } }
                ];
            }
            const skip = (page - 1) * limit;
            const [methods, total] = yield Promise.all([
                paymentMethod_model_1.PaymentMethod.find(query)
                    .populate('userId', 'fullName email role')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                paymentMethod_model_1.PaymentMethod.countDocuments(query)
            ]);
            return {
                methods,
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
     * Create a payment method for a specific user (Admin override)
     */
    createPaymentMethod(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const mockStripeId = `pm_admin_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const method = yield paymentMethod_model_1.PaymentMethod.create({
                userId: new mongoose_1.Types.ObjectId(data.userId),
                cardholderName: data.cardholderName,
                brand: data.brand || paymentMethod_model_1.CardBrand.UNKNOWN,
                last4: data.last4,
                expiryDate: data.expiryDate,
                stripePaymentMethodId: mockStripeId,
                isDefault: data.isDefault || false
            });
            return method;
        });
    }
    /**
     * Update a payment method (Admin override)
     */
    updatePaymentMethod(methodId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = yield paymentMethod_model_1.PaymentMethod.findById(methodId);
            if (!method)
                throw new AppError_1.default('Payment method not found', 404);
            // Update fields if provided
            if (updateData.cardholderName)
                method.cardholderName = updateData.cardholderName;
            if (updateData.brand)
                method.brand = updateData.brand;
            if (updateData.last4)
                method.last4 = updateData.last4;
            if (updateData.expiryDate)
                method.expiryDate = updateData.expiryDate;
            if (updateData.isDefault !== undefined)
                method.isDefault = updateData.isDefault;
            yield method.save();
            return method;
        });
    }
    /**
     * Delete a payment method (Admin override)
     */
    deletePaymentMethod(methodId) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = yield paymentMethod_model_1.PaymentMethod.findByIdAndDelete(methodId);
            if (!method)
                throw new AppError_1.default('Payment method not found', 404);
            return { message: 'Payment method deleted successfully by admin' };
        });
    }
}
exports.default = new AdminPaymentMethodService();
