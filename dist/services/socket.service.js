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
exports.socketService = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const chatRoom_model_1 = require("../models/chatRoom.model");
const message_model_1 = require("../models/message.model");
const notification_model_1 = require("../models/notification.model");
class SocketService {
    constructor() {
        this.io = null;
    }
    init(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });
        // Auth Middleware
        this.io.use((socket, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.token;
                if (!token)
                    return next(new Error('Authentication error: Token required'));
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'super-secret-key');
                const user = yield user_model_1.User.findById(decoded.userId);
                if (!user)
                    return next(new Error('Authentication error: User not found'));
                socket.user = { userId: user._id.toString(), role: user.role };
                next();
            }
            catch (err) {
                next(new Error('Authentication error: Invalid token'));
            }
        }));
        this.io.on('connection', (this.handleConnection.bind(this)));
        console.log('Socket.IO initialized with Notifications');
    }
    handleConnection(socket) {
        const { userId, role } = socket.user;
        console.log(`User connected: ${userId} (${role})`);
        // 1. Join Personal Room for Notifications
        socket.join(userId);
        // 2. Join Role Room (For Admin Dashboard presence)
        socket.join(`role_${role}`);
        socket.on('join_room', (_a, callback_1) => __awaiter(this, [_a, callback_1], void 0, function* ({ targetUserId }, callback) {
            this.handleJoinRoom(socket, targetUserId, callback);
        }));
        socket.on('send_message', (data, callback) => __awaiter(this, void 0, void 0, function* () {
            this.handleSendMessage(socket, data, callback);
        }));
        socket.on('typing', ({ chatRoomId }) => {
            socket.to(chatRoomId).emit('typing', { userId, chatRoomId });
        });
        socket.on('stop_typing', ({ chatRoomId }) => {
            socket.to(chatRoomId).emit('stop_typing', { userId, chatRoomId });
        });
        socket.on('disconnect', () => {
            // Admin Dashboard could update "Online Status" here
            // socket.to('role_ADMIN').emit('user_offline', { userId });
        });
    }
    handleJoinRoom(socket, targetUserId, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const currentUserId = socket.user.userId;
                const currentUserRole = socket.user.role;
                const targetUser = yield user_model_1.User.findById(targetUserId);
                if (!targetUser)
                    throw new Error('Target user not found');
                // RBAC
                if ((currentUserRole === user_model_1.UserRole.CUSTOMER && targetUser.role === user_model_1.UserRole.ADMIN) ||
                    (currentUserRole === user_model_1.UserRole.ADMIN && targetUser.role === user_model_1.UserRole.CUSTOMER)) {
                    throw new Error('Chat forbidden between Customer and Admin');
                }
                let room = yield chatRoom_model_1.ChatRoom.findOne({ participants: { $all: [currentUserId, targetUserId] } });
                if (!room) {
                    room = yield chatRoom_model_1.ChatRoom.create({ participants: [currentUserId, targetUserId], isActive: true });
                }
                const roomId = room._id.toString();
                socket.join(roomId);
                // Fetch last 50 messages
                const messages = yield message_model_1.Message.find({ chatRoomId: room._id })
                    .sort({ createdAt: -1 })
                    .limit(50)
                    .populate('sender', 'fullName profilePic')
                    .lean();
                if (callback)
                    callback({ status: 'ok', roomId, messages: messages.reverse() });
            }
            catch (error) {
                console.error('Join Error:', error);
                if (callback)
                    callback({ status: 'error', message: error.message });
            }
        });
    }
    handleSendMessage(socket_1, _a, callback_1) {
        return __awaiter(this, arguments, void 0, function* (socket, { chatRoomId, content }, callback) {
            try {
                const message = yield message_model_1.Message.create({
                    chatRoomId,
                    sender: socket.user.userId,
                    content,
                    readBy: [socket.user.userId]
                });
                yield chatRoom_model_1.ChatRoom.findByIdAndUpdate(chatRoomId, { lastMessage: message._id });
                const populatedMessage = yield message.populate('sender', 'fullName profilePic');
                // Broadcast to the chat room
                this.io.to(chatRoomId).emit('receive_message', populatedMessage);
                // Handle Notification for Recipient
                // Identify recipient (the one who is NOT the sender)
                const room = yield chatRoom_model_1.ChatRoom.findById(chatRoomId);
                if (room) {
                    const recipientId = room.participants.find(p => p.toString() !== socket.user.userId);
                    if (recipientId) {
                        // Check if recipient is IN the room? (Optimization: Socket.io 4 has detailed room API)
                        // reliable approach: Just emit to their personal room 'notification'
                        // Frontend decides to show toast or not (if already in chat view)
                        // 1. Persist Notification (For Activity Feed)
                        yield notification_model_1.Notification.create({
                            userId: recipientId,
                            type: notification_model_1.NotificationType.MESSAGE,
                            title: `New message from ${populatedMessage.sender.fullName}`,
                            message: content.substring(0, 50),
                            metadata: { chatRoomId, senderId: socket.user.userId }
                        });
                        // 2. Emit Real-time signal
                        this.io.to(recipientId.toString()).emit('notification', {
                            type: 'message',
                            chatRoomId,
                            senderName: populatedMessage.sender.fullName,
                            content: content.substring(0, 30)
                        });
                    }
                }
                if (callback)
                    callback({ status: 'ok', message: populatedMessage });
            }
            catch (error) {
                console.error('Send Error:', error);
                if (callback)
                    callback({ status: 'error', message: error.message });
            }
        });
    }
}
exports.socketService = new SocketService();
