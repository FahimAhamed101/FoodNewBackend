"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Profile = void 0;
const mongoose_1 = require("mongoose");
const profileSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    name: {
        type: String,
        trim: true,
        default: '',
    },
    phone: {
        type: String,
        trim: true,
        default: '',
    },
    dateOfBirth: {
        type: Date,
    },
    address: {
        type: String,
        trim: true,
        default: '',
    },
    city: {
        type: String,
        trim: true,
        default: '',
        index: true,
    },
    state: {
        type: String,
        trim: true,
        default: '',
        index: true,
    },
    profilePic: {
        type: String,
        default: '',
    },
    avatar: {
        type: String,
        default: '',
    },
    bio: {
        type: String,
        trim: true,
        default: '',
    },
    isVerify: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
exports.Profile = (0, mongoose_1.model)('Profile', profileSchema);
