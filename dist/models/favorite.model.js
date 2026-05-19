"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Favorite = void 0;
const mongoose_1 = require("mongoose");
const favoriteSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    foodId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Food',
        required: true,
        index: true,
    },
}, {
    timestamps: { createdAt: true, updatedAt: false }, // Only need createdAt
});
// Compound unique index to prevent duplicate favorites per user
favoriteSchema.index({ userId: 1, foodId: 1 }, { unique: true });
// Index for getting a user's feed sorted by time
favoriteSchema.index({ userId: 1, createdAt: -1 });
exports.Favorite = (0, mongoose_1.model)('Favorite', favoriteSchema);
