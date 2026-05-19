"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlacklistedToken = void 0;
const mongoose_1 = require("mongoose");
const blacklistedTokenSchema = new mongoose_1.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 },
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
exports.BlacklistedToken = (0, mongoose_1.model)('BlacklistedToken', blacklistedTokenSchema);
