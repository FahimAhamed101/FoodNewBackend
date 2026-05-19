"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.State = void 0;
const mongoose_1 = require("mongoose");
const stateSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'State name is required'],
        unique: true,
        trim: true,
        index: true,
    },
    code: {
        type: String,
        required: [true, 'State code is required'],
        uppercase: true,
        trim: true,
        minlength: 2,
        maxlength: 3,
        index: true,
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        default: 'USA',
        uppercase: true,
        index: true,
    },
    tax: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
}, {
    timestamps: true,
});
stateSchema.index({ code: 1, country: 1 }, { unique: true });
stateSchema.index({ country: 1, isActive: 1 });
exports.State = (0, mongoose_1.model)('State', stateSchema);
