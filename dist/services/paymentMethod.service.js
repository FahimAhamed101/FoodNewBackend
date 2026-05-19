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
const AppError_1 = __importDefault(require("../utils/AppError"));
const mongoose_1 = require("mongoose");
class PaymentMethodService {
    /**
     * Get all payment methods for a user
     */
    getPaymentMethods(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield paymentMethod_model_1.PaymentMethod.find({ userId: new mongoose_1.Types.ObjectId(userId) })
                .sort({ isDefault: -1, createdAt: -1 });
        });
    }
    /**
     * Add a new payment method
     * In a real app, this would integrate with Stripe. This implementation
     * extracts card details into a 'secure' representation.
     */
    addPaymentMethod(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Mock Stripe Logic: In real life, we getpm_... from Stripe
            const mockStripeId = `pm_mock_${Math.random().toString(36).substr(2, 9)}`;
            // Extract basic info from the card number for display (last 4)
            const cardNumber = data.cardNumber.replace(/\s/g, '');
            const last4 = cardNumber.slice(-4);
            // Simple Brand Detection
            let brand = 'Unknown';
            if (cardNumber.startsWith('4'))
                brand = 'Visa';
            else if (cardNumber.startsWith('5'))
                brand = 'MasterCard';
            const paymentMethod = yield paymentMethod_model_1.PaymentMethod.create({
                userId: new mongoose_1.Types.ObjectId(userId),
                cardholderName: data.cardholderName,
                brand: brand,
                last4: last4,
                expiryDate: data.expiryDate,
                stripePaymentMethodId: mockStripeId,
                isDefault: data.isDefault || false
            });
            // If this is the first card, make it default
            const count = yield paymentMethod_model_1.PaymentMethod.countDocuments({ userId: new mongoose_1.Types.ObjectId(userId) });
            if (count === 1) {
                paymentMethod.isDefault = true;
                yield paymentMethod.save();
            }
            return paymentMethod;
        });
    }
    /**
     * Set a payment method as default
     */
    setDefault(userId, methodId) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = yield paymentMethod_model_1.PaymentMethod.findOne({
                _id: new mongoose_1.Types.ObjectId(methodId),
                userId: new mongoose_1.Types.ObjectId(userId)
            });
            if (!method)
                throw new AppError_1.default('Payment method not found', 404);
            method.isDefault = true;
            yield method.save(); // Model pre-save hook handles clearing others
            return method;
        });
    }
    /**
     * Delete a payment method
     */
    deletePaymentMethod(userId, methodId) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = yield paymentMethod_model_1.PaymentMethod.findOneAndDelete({
                _id: new mongoose_1.Types.ObjectId(methodId),
                userId: new mongoose_1.Types.ObjectId(userId)
            });
            if (!method)
                throw new AppError_1.default('Payment method not found', 404);
            // If we deleted the default card, assign a new default if possible
            if (method.isDefault) {
                const nextBest = yield paymentMethod_model_1.PaymentMethod.findOne({ userId: new mongoose_1.Types.ObjectId(userId) });
                if (nextBest) {
                    nextBest.isDefault = true;
                    yield nextBest.save();
                }
            }
            return { message: 'Payment method removed successfully' };
        });
    }
}
exports.default = new PaymentMethodService();
