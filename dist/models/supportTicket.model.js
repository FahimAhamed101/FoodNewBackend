"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportTicket = exports.TicketStatus = exports.TicketPriority = void 0;
const mongoose_1 = require("mongoose");
var TicketPriority;
(function (TicketPriority) {
    TicketPriority["LOW"] = "Low";
    TicketPriority["MEDIUM"] = "Medium";
    TicketPriority["HIGH"] = "High";
})(TicketPriority || (exports.TicketPriority = TicketPriority = {}));
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["OPEN"] = "Open";
    TicketStatus["IN_PROGRESS"] = "In Progress";
    TicketStatus["RESOLVED"] = "Resolved";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
const supportTicketSchema = new mongoose_1.Schema({
    ticketId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    userType: {
        type: String,
        enum: ['Customer', 'Restaurant'],
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: Object.values(TicketPriority),
        default: TicketPriority.MEDIUM
    },
    status: {
        type: String,
        enum: Object.values(TicketStatus),
        default: TicketStatus.OPEN,
        index: true
    },
    chatRoomId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ChatRoom'
    }
}, {
    timestamps: true
});
// Auto-increment ticketId logic (simple version)
supportTicketSchema.pre('validate', function () {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isNew && !this.ticketId) {
            const SupportTicketModel = (0, mongoose_1.model)('SupportTicket');
            const lastTicket = yield SupportTicketModel.findOne().sort({ createdAt: -1 });
            let nextNum = 1000;
            if (lastTicket && lastTicket.ticketId) {
                const lastNum = parseInt(lastTicket.ticketId.split('-')[1]);
                if (!isNaN(lastNum))
                    nextNum = lastNum + 1;
            }
            this.ticketId = `TKT-${nextNum}`;
        }
    });
});
exports.SupportTicket = (0, mongoose_1.model)('SupportTicket', supportTicketSchema);
