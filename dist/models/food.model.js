"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Food = void 0;
const mongoose_1 = require("mongoose");
const foodSchema = new mongoose_1.Schema({
    providerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    categoryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        index: true // Indexed for search
    },
    productDescription: {
        type: String,
        trim: true
    },
    image: {
        type: String
    },
    calories: {
        type: Number,
        default: 0
    },
    baseRevenue: {
        type: Number,
        required: true,
        min: 0
    },
    serviceFee: {
        type: Number,
        required: true,
        min: 0
    },
    finalPriceTag: {
        type: Number,
        required: true,
        min: 0
    },
    rating: {
        type: Number,
        default: 0,
        max: 5,
        index: true // Indexed for search
    },
    foodStatus: {
        type: Boolean,
        default: true // Active
    },
    foodAvailability: {
        type: Boolean,
        default: true // Available
    }
}, {
    timestamps: true,
});
foodSchema.index({ categoryId: 1, rating: -1 });
exports.Food = (0, mongoose_1.model)('Food', foodSchema);
