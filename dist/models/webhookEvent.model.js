"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookEvent = void 0;
const mongoose_1 = require("mongoose");
const webhookEventSchema = new mongoose_1.Schema({
    eventId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    type: {
        type: String,
        required: true,
        index: true,
    },
    processed: {
        type: Boolean,
        default: false,
        index: true,
    },
    processedAt: {
        type: Date,
    },
    data: {
        type: mongoose_1.Schema.Types.Mixed,
    },
}, {
    timestamps: true,
});
// TTL index: Auto-delete webhook events after 30 days
webhookEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
exports.WebhookEvent = (0, mongoose_1.model)('WebhookEvent', webhookEventSchema);
