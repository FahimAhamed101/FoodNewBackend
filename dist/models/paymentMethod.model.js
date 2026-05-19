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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethod = exports.CardBrand = void 0;
const mongoose_1 = require("mongoose");
var CardBrand;
(function (CardBrand) {
    CardBrand["VISA"] = "Visa";
    CardBrand["MASTERCARD"] = "MasterCard";
    CardBrand["AMEX"] = "American Express";
    CardBrand["DISCOVER"] = "Discover";
    CardBrand["UNKNOWN"] = "Unknown";
})(CardBrand || (exports.CardBrand = CardBrand = {}));
const paymentMethodSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    cardholderName: {
        type: String,
        required: true,
        trim: true,
    },
    brand: {
        type: String,
        enum: Object.values(CardBrand),
        default: CardBrand.UNKNOWN,
    },
    last4: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 4,
    },
    expiryDate: {
        type: String,
        required: true, // Format MM/YY
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    stripePaymentMethodId: {
        type: String,
        required: true,
        unique: true,
    },
}, {
    timestamps: true,
});
paymentMethodSchema.pre('save', function () {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isDefault) {
            yield this.constructor.updateMany({ userId: this.userId, _id: { $ne: this._id } }, { $set: { isDefault: false } });
        }
    });
});
exports.PaymentMethod = (0, mongoose_1.model)('PaymentMethod', paymentMethodSchema);
