"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = void 0;
const mongoose_1 = require("mongoose");
const reviewSchema = new mongoose_1.Schema({
    providerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    orderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    foodId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Food',
        index: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: true,
        trim: true,
    },
    reply: {
        comment: { type: String, trim: true },
        createdAt: { type: Date },
    },
}, {
    timestamps: true,
});
reviewSchema.index({ providerId: 1, rating: -1 });
reviewSchema.index({ orderId: 1, customerId: 1, foodId: 1 }, { unique: true }); // One review per item per order
exports.Review = (0, mongoose_1.model)('Review', reviewSchema);
