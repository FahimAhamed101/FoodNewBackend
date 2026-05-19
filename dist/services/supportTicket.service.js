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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supportTicket_model_1 = require("../models/supportTicket.model");
const user_model_1 = require("../models/user.model");
const AppError_1 = __importDefault(require("../utils/AppError"));
const mongoose_1 = require("mongoose");
const chatRoom_model_1 = require("../models/chatRoom.model");
class SupportTicketService {
    /**
     * Create a new support ticket
     */
    createTicket(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findById(userId);
            if (!user)
                throw new AppError_1.default('User not found', 404);
            const userType = user.role === user_model_1.UserRole.PROVIDER ? 'Restaurant' : 'Customer';
            // Auto-create a ChatRoom if not provided
            let chatRoomId = data.chatRoomId;
            if (!chatRoomId) {
                // Find an admin to add to the chat room (optional, or just add the user)
                const admin = yield user_model_1.User.findOne({ role: user_model_1.UserRole.ADMIN });
                const participants = [new mongoose_1.Types.ObjectId(userId)];
                if (admin)
                    participants.push(admin._id);
                const newRoom = yield chatRoom_model_1.ChatRoom.create({
                    participants,
                    isActive: true
                });
                chatRoomId = newRoom._id;
            }
            const ticket = yield supportTicket_model_1.SupportTicket.create({
                userId: new mongoose_1.Types.ObjectId(userId),
                userType,
                subject: data.subject,
                description: data.description,
                priority: data.priority,
                chatRoomId: new mongoose_1.Types.ObjectId(chatRoomId)
            });
            return ticket;
        });
    }
    /**
     * Get tickets for Admin with search and filters
     */
    getAdminTickets(queryParams) {
        return __awaiter(this, void 0, void 0, function* () {
            const { search, status, priority, userType, page = 1, limit = 10 } = queryParams;
            const filter = {};
            if (status)
                filter.status = status;
            if (priority)
                filter.priority = priority;
            if (userType)
                filter.userType = userType;
            if (search) {
                filter.$or = [
                    { subject: { $regex: search, $options: 'i' } },
                    { ticketId: { $regex: search, $options: 'i' } }
                ];
            }
            const skip = (Number(page) - 1) * Number(limit);
            const [tickets, total] = yield Promise.all([
                supportTicket_model_1.SupportTicket.find(filter)
                    .populate('userId', 'fullName email')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit))
                    .lean(),
                supportTicket_model_1.SupportTicket.countDocuments(filter)
            ]);
            const admin = yield user_model_1.User.findOne({ role: user_model_1.UserRole.ADMIN }).select('_id');
            const formattedTickets = yield Promise.all(tickets.map((t) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c;
                let chatRoomId = t.chatRoomId;
                // Auto-Healing: If chatRoomId is empty, create one and update the ticket
                if (!chatRoomId) {
                    const participants = [((_a = t.userId) === null || _a === void 0 ? void 0 : _a._id) || t.userId];
                    if (admin)
                        participants.push(admin._id);
                    const newRoom = yield chatRoom_model_1.ChatRoom.create({
                        participants,
                        isActive: true
                    });
                    chatRoomId = newRoom._id;
                    // Sync back to database so next time it's already there
                    yield supportTicket_model_1.SupportTicket.findByIdAndUpdate(t._id, { chatRoomId: newRoom._id });
                }
                return {
                    id: t._id,
                    "convershasonId": chatRoomId,
                    "userID": ((_b = t.userId) === null || _b === void 0 ? void 0 : _b._id) || t.userId || "",
                    "Ticket ID": t.ticketId,
                    "Subject": t.subject,
                    "User Type": t.userType,
                    "User": ((_c = t.userId) === null || _c === void 0 ? void 0 : _c.fullName) || 'Unknown User',
                    "Priority": t.priority,
                    "Status": t.status,
                    "Date": t.createdAt,
                    "Description": t.description
                };
            })));
            return {
                tickets: formattedTickets,
                meta: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            };
        });
    }
    /**
     * Get tickets for a specific user
     */
    getUserTickets(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield supportTicket_model_1.SupportTicket.find({ userId: new mongoose_1.Types.ObjectId(userId) }).sort({ createdAt: -1 });
        });
    }
    /**
     * Update ticket status or priority
     */
    updateTicket(ticketId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const ticket = yield supportTicket_model_1.SupportTicket.findByIdAndUpdate(ticketId, { $set: data }, { new: true, runValidators: true });
            if (!ticket)
                throw new AppError_1.default('Ticket not found', 404);
            return ticket;
        });
    }
    /**
     * Get single ticket details
     */
    getTicket(ticketId) {
        return __awaiter(this, void 0, void 0, function* () {
            const ticket = yield supportTicket_model_1.SupportTicket.findById(ticketId).populate('userId', 'fullName email phone');
            if (!ticket)
                throw new AppError_1.default('Ticket not found', 404);
            return ticket;
        });
    }
}
exports.default = new SupportTicketService();
