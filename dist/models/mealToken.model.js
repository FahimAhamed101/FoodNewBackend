"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MealToken = exports.MealTokenStatus = void 0;
const mongoose_1 = require("mongoose");
var MealTokenStatus;
(function (MealTokenStatus) {
    MealTokenStatus["AVAILABLE"] = "available";
    MealTokenStatus["CLAIMED"] = "claimed";
})(MealTokenStatus || (exports.MealTokenStatus = MealTokenStatus = {}));
const mealTokenSchema = new mongoose_1.Schema({
    tokenId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    donorUserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    donationOrderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    mealCount: {
        type: Number,
        required: true,
        min: 1,
    },
    pricePerMeal: {
        type: Number,
        required: true,
        default: 5.99,
    },
    platformFee: {
        type: Number,
        required: true,
        default: 0,
    },
    stateTax: {
        type: Number,
        required: true,
        default: 0,
    },
    totalPaid: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(MealTokenStatus),
        default: MealTokenStatus.AVAILABLE,
        index: true,
    },
    claimedByUserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    claimedAt: {
        type: Date,
        default: null,
    },
    claimedOrderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Order',
        default: null,
    },
}, { timestamps: true });
mealTokenSchema.index({ status: 1, createdAt: -1 });
mealTokenSchema.index({ donorUserId: 1, status: 1 });
mealTokenSchema.index({ claimedByUserId: 1, claimedAt: -1 });
exports.MealToken = (0, mongoose_1.model)('MealToken', mealTokenSchema);
