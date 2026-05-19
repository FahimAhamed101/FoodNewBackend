"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const mongoose_1 = require("mongoose");
const categorySchema = new mongoose_1.Schema({
    categoryName: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        minlength: [2, 'Category name must be at least 2 characters'],
        maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    categoryStatus: {
        type: Boolean,
        default: true,
    },
    image: {
        type: String,
        default: '',
    },
    providerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Provider ID is required'],
    },
}, {
    timestamps: true,
});
categorySchema.index({ providerId: 1, categoryName: 1 }, { unique: true });
exports.Category = (0, mongoose_1.model)('Category', categorySchema);
