"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    chatRoomId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ChatRoom', required: true, index: true },
    sender: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: false, trim: true }, // Made optional for image-only messages
    imageUrl: { type: String, required: false }, // New field
    messageType: { type: String, enum: ['TEXT', 'IMAGE', 'MIXED'], default: 'TEXT' }, // New field
    readBy: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });
// Index for efficient retrieval of messages per chat
messageSchema.index({ chatRoomId: 1, createdAt: 1 });
exports.Message = (0, mongoose_1.model)('Message', messageSchema);
