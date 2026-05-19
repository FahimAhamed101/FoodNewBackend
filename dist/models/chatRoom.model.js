"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRoom = void 0;
const mongoose_1 = require("mongoose");
const chatRoomSchema = new mongoose_1.Schema({
    participants: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true }],
    isActive: { type: Boolean, default: true },
    lastMessage: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Message' },
}, { timestamps: true });
// Ensure searching for participants is efficient
chatRoomSchema.index({ participants: 1 });
exports.ChatRoom = (0, mongoose_1.model)('ChatRoom', chatRoomSchema);
