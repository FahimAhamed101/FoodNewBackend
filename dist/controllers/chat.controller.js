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
exports.getCustomersForChat = exports.startAdminCustomerConversation = exports.startCustomerAdminConversation = exports.getAdminCustomerConversations = exports.sendMessageWithImage = exports.archiveConversation = exports.markRoomAsRead = exports.startConversation = exports.getConversationMessages = exports.getConversationById = exports.getConversations = void 0;
const mongoose_1 = require("mongoose");
const chatRoom_model_1 = require("../models/chatRoom.model");
const message_model_1 = require("../models/message.model");
const profile_model_1 = require("../models/profile.model");
const providerProfile_model_1 = require("../models/providerProfile.model");
const user_model_1 = require("../models/user.model");
const AppError_1 = __importDefault(require("../utils/AppError"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
// ... (Previous imports and helpers remain unchanged - kept implicitly for context)
// --- HELPER: Format Response ---
const formatResponse = (data) => ({
    success: true,
    data,
    meta: {
        timestamp: new Date().toISOString()
    }
});
const findPrimaryAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    const admin = yield user_model_1.User.findOne({
        role: user_model_1.UserRole.ADMIN,
        isActive: true,
        isSuspended: { $ne: true },
    })
        .sort({ createdAt: 1 })
        .select('_id role')
        .lean();
    return admin ? { id: admin._id.toString(), role: admin.role } : null;
});
const ensureProviderAdminConversation = (providerObjectId) => __awaiter(void 0, void 0, void 0, function* () {
    const admin = yield findPrimaryAdmin();
    if (!admin)
        return null;
    const adminObjectId = new mongoose_1.Types.ObjectId(admin.id);
    let room = yield chatRoom_model_1.ChatRoom.findOne({
        participants: { $all: [providerObjectId, adminObjectId] },
    });
    if (!room) {
        room = yield chatRoom_model_1.ChatRoom.create({
            participants: [providerObjectId, adminObjectId],
            isActive: true,
        });
    }
    return room;
});
const buildProfilePictureMap = (userIds) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const normalizedIds = Array.from(new Set(userIds.filter((id) => typeof id === 'string' && mongoose_1.Types.ObjectId.isValid(id))));
    if (!normalizedIds.length)
        return new Map();
    const objectIds = normalizedIds.map((id) => new mongoose_1.Types.ObjectId(id));
    const [profiles, providerProfiles] = yield Promise.all([
        profile_model_1.Profile.find({ userId: { $in: objectIds } }).select('userId profilePic avatar').lean(),
        providerProfile_model_1.ProviderProfile.find({ providerId: { $in: objectIds } }).select('providerId profile').lean(),
    ]);
    const profilePictureMap = new Map();
    for (const profile of profiles) {
        const profileOwnerId = (_b = (_a = profile === null || profile === void 0 ? void 0 : profile.userId) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a);
        const image = (profile === null || profile === void 0 ? void 0 : profile.profilePic) || (profile === null || profile === void 0 ? void 0 : profile.avatar) || '';
        if (profileOwnerId && image) {
            profilePictureMap.set(profileOwnerId, image);
        }
    }
    for (const providerProfile of providerProfiles) {
        const providerId = (_d = (_c = providerProfile === null || providerProfile === void 0 ? void 0 : providerProfile.providerId) === null || _c === void 0 ? void 0 : _c.toString) === null || _d === void 0 ? void 0 : _d.call(_c);
        const image = (providerProfile === null || providerProfile === void 0 ? void 0 : providerProfile.profile) || '';
        if (providerId && image && !profilePictureMap.has(providerId)) {
            profilePictureMap.set(providerId, image);
        }
    }
    return profilePictureMap;
});
const extractParticipantIdsFromRooms = (rooms) => {
    var _a, _b;
    const participantIds = [];
    for (const room of rooms) {
        const participants = Array.isArray(room === null || room === void 0 ? void 0 : room.participantDetails) ? room.participantDetails : [];
        for (const participant of participants) {
            const participantId = (_b = (_a = participant === null || participant === void 0 ? void 0 : participant._id) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a);
            if (participantId)
                participantIds.push(participantId);
        }
    }
    return Array.from(new Set(participantIds));
};
const formatUser = (user, role, profilePictureMap) => {
    var _a, _b;
    if (!user)
        return null;
    const userId = (_b = (_a = user === null || user === void 0 ? void 0 : user._id) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a);
    const resolvedProfilePicture = (user === null || user === void 0 ? void 0 : user.profilePic) ||
        (user === null || user === void 0 ? void 0 : user.googlePicture) ||
        (userId ? profilePictureMap === null || profilePictureMap === void 0 ? void 0 : profilePictureMap.get(userId) : '') ||
        null;
    return {
        id: user._id,
        email: user.email,
        role: user.role || role,
        profile: {
            fullName: user.fullName,
            profilePicture: resolvedProfilePicture,
            companyName: null
        }
    };
};
const transformConversation = (room, currentUserId, profilePictureMap) => {
    var _a;
    const participants = Array.isArray(room.participantDetails)
        ? room.participantDetails
        : (Array.isArray(room.participants) ? room.participants : []);
    const customer = participants.find((p) => (p === null || p === void 0 ? void 0 : p.role) === user_model_1.UserRole.CUSTOMER);
    const provider = participants.find((p) => (p === null || p === void 0 ? void 0 : p.role) === user_model_1.UserRole.PROVIDER);
    const admin = participants.find((p) => (p === null || p === void 0 ? void 0 : p.role) === user_model_1.UserRole.ADMIN);
    const me = participants.find((p) => { var _a, _b; return ((_b = (_a = p === null || p === void 0 ? void 0 : p._id) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) === currentUserId; });
    let counterpart = participants.find((p) => { var _a, _b; return ((_b = (_a = p === null || p === void 0 ? void 0 : p._id) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) !== currentUserId; }) || null;
    if ((me === null || me === void 0 ? void 0 : me.role) === user_model_1.UserRole.PROVIDER && admin) {
        counterpart = admin;
    }
    else if ((me === null || me === void 0 ? void 0 : me.role) === user_model_1.UserRole.ADMIN && provider) {
        counterpart = provider;
    }
    else if ((me === null || me === void 0 ? void 0 : me.role) === user_model_1.UserRole.ADMIN && customer && !provider) {
        // Admin ↔ Customer conversation
        counterpart = customer;
    }
    else if ((me === null || me === void 0 ? void 0 : me.role) === user_model_1.UserRole.CUSTOMER && admin && !provider) {
        // Customer ↔ Admin conversation
        counterpart = admin;
    }
    else if ((me === null || me === void 0 ? void 0 : me.role) === user_model_1.UserRole.CUSTOMER && provider) {
        counterpart = provider;
    }
    return {
        id: room._id,
        customerId: customer === null || customer === void 0 ? void 0 : customer._id,
        providerId: provider === null || provider === void 0 ? void 0 : provider._id,
        adminId: admin === null || admin === void 0 ? void 0 : admin._id,
        status: room.isActive ? 'ACTIVE' : 'ARCHIVED',
        lastMessageAt: ((_a = room.lastMessageDetails) === null || _a === void 0 ? void 0 : _a.createdAt) || room.updatedAt,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        customer: formatUser(customer, user_model_1.UserRole.CUSTOMER, profilePictureMap),
        provider: formatUser(provider, user_model_1.UserRole.PROVIDER, profilePictureMap),
        admin: formatUser(admin, user_model_1.UserRole.ADMIN, profilePictureMap),
        counterpartId: (counterpart === null || counterpart === void 0 ? void 0 : counterpart._id) || null,
        counterpartRole: (counterpart === null || counterpart === void 0 ? void 0 : counterpart.role) || null,
        counterpart: counterpart ? formatUser(counterpart, counterpart.role || 'UNKNOWN', profilePictureMap) : null,
        messages: (room.recentMessages || []).map((msg) => {
            var _a;
            return ({
                id: msg._id,
                content: msg.content,
                senderId: msg.sender,
                role: ((_a = msg.senderDetails) === null || _a === void 0 ? void 0 : _a.role) || 'UNKNOWN',
                type: msg.messageType || 'TEXT',
                attachmentUrl: msg.imageUrl || null,
                createdAt: msg.createdAt
            });
        }).reverse(), // Show in chronological order within the array
        _count: {
            messages: room.messageCount || 0
        },
        lastMessage: room.lastMessageDetails ? {
            content: room.lastMessageDetails.content,
            createdAt: room.lastMessageDetails.createdAt
        } : null,
        unreadCount: room.unreadCount || 0
    };
};
const assertConversationAccess = (conversationId, userId, userRole) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(conversationId)) {
        throw new AppError_1.default('Invalid conversation id', 400, 'VALIDATION_ERROR');
    }
    const room = yield chatRoom_model_1.ChatRoom.findById(conversationId).populate('participants', 'role');
    if (!room) {
        throw new AppError_1.default('Conversation not found', 404, 'NOT_FOUND_ERROR');
    }
    const participants = Array.isArray(room.participants) ? room.participants : [];
    const isParticipant = participants.some((p) => { var _a, _b; return ((_b = (_a = p === null || p === void 0 ? void 0 : p._id) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) === userId; });
    if (!isParticipant) {
        throw new AppError_1.default('Not authorized to access this conversation', 403, 'ROLE_ERROR');
    }
    if (userRole === user_model_1.UserRole.PROVIDER) {
        const hasAdminParticipant = participants.some((p) => (p === null || p === void 0 ? void 0 : p.role) === user_model_1.UserRole.ADMIN);
        if (!hasAdminParticipant) {
            throw new AppError_1.default('Providers can only access admin conversations', 403, 'ROLE_ERROR');
        }
    }
    // Customer can only access conversations where the other participant is a provider or admin
    if (userRole === user_model_1.UserRole.CUSTOMER) {
        const hasValidCounterpart = participants.some((p) => {
            var _a, _b;
            return ((_b = (_a = p === null || p === void 0 ? void 0 : p._id) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) !== userId &&
                ((p === null || p === void 0 ? void 0 : p.role) === user_model_1.UserRole.PROVIDER || (p === null || p === void 0 ? void 0 : p.role) === user_model_1.UserRole.ADMIN);
        });
        if (!hasValidCounterpart) {
            throw new AppError_1.default('Customers can only access provider or admin conversations', 403, 'ROLE_ERROR');
        }
    }
    return room;
});
// Helper: ensure admin-customer conversation room exists
const ensureAdminCustomerConversation = (adminObjectId, customerObjectId) => __awaiter(void 0, void 0, void 0, function* () {
    let room = yield chatRoom_model_1.ChatRoom.findOne({
        participants: { $all: [adminObjectId, customerObjectId] },
    });
    if (!room) {
        room = yield chatRoom_model_1.ChatRoom.create({
            participants: [adminObjectId, customerObjectId],
            isActive: true,
        });
    }
    return room;
});
// 1. GET CONVERSATIONS (Inbox)
const getConversations = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = new mongoose_1.Types.ObjectId((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId);
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        const limit = parseInt(req.query.limit) || 20;
        if (userRole === user_model_1.UserRole.PROVIDER) {
            yield ensureProviderAdminConversation(userId);
        }
        const conversations = yield chatRoom_model_1.ChatRoom.aggregate([
            { $match: { participants: userId, isActive: true } }, // Filter out archived/inactive by default
            {
                $lookup: {
                    from: 'messages',
                    localField: 'lastMessage',
                    foreignField: '_id',
                    as: 'lastMessageDetails'
                }
            },
            { $unwind: { path: '$lastMessageDetails', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'participants',
                    foreignField: '_id',
                    as: 'participantDetails'
                }
            },
            {
                $lookup: {
                    from: 'messages',
                    let: { roomId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$chatRoomId', '$$roomId'] },
                                        { $not: { $in: [userId, '$readBy'] } }
                                    ]
                                }
                            }
                        },
                        { $count: 'count' }
                    ],
                    as: 'unreadInfo'
                }
            },
            {
                $lookup: {
                    from: 'messages',
                    let: { roomId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$chatRoomId', '$$roomId'] } } },
                        { $count: 'count' }
                    ],
                    as: 'totalMessagesInfo'
                }
            },
            {
                $lookup: {
                    from: 'messages',
                    let: { roomId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$chatRoomId', '$$roomId'] } } },
                        { $sort: { createdAt: -1 } },
                        { $limit: 5 },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'sender',
                                foreignField: '_id',
                                as: 'senderDetails'
                            }
                        },
                        { $unwind: { path: '$senderDetails', preserveNullAndEmptyArrays: true } }
                    ],
                    as: 'recentMessages'
                }
            },
            {
                $project: {
                    _id: 1,
                    isActive: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    participants: 1,
                    participantDetails: 1,
                    lastMessageDetails: 1,
                    recentMessages: 1,
                    unreadCount: { $ifNull: [{ $arrayElemAt: ['$unreadInfo.count', 0] }, 0] },
                    messageCount: { $ifNull: [{ $arrayElemAt: ['$totalMessagesInfo.count', 0] }, 0] }
                }
            },
            { $sort: { updatedAt: -1 } },
            { $limit: limit }
        ]);
        const participantIds = extractParticipantIdsFromRooms(conversations);
        const profilePictureMap = yield buildProfilePictureMap(participantIds);
        let formattedConversations = conversations.map(c => transformConversation(c, userId.toString(), profilePictureMap));
        if (userRole === user_model_1.UserRole.PROVIDER) {
            formattedConversations = formattedConversations.filter((conversation) => (conversation === null || conversation === void 0 ? void 0 : conversation.counterpartRole) === user_model_1.UserRole.ADMIN);
        }
        res.status(200).json(formatResponse({
            conversations: formattedConversations,
            cursor: null,
            hasMore: false
        }));
    }
    catch (error) {
        next(error);
    }
});
exports.getConversations = getConversations;
// 2. GET SINGLE CONVERSATION
const getConversationById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { conversationId } = req.params;
        const userId = new mongoose_1.Types.ObjectId((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId);
        const userRole = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) || '';
        yield assertConversationAccess(conversationId, userId.toString(), userRole);
        const conversationAgg = yield chatRoom_model_1.ChatRoom.aggregate([
            { $match: { _id: new mongoose_1.Types.ObjectId(conversationId) } },
            // Note: Removed participant check in match to allow viewing, checked later or assumed allowed
            {
                $lookup: {
                    from: 'messages',
                    localField: 'lastMessage',
                    foreignField: '_id',
                    as: 'lastMessageDetails'
                }
            },
            { $unwind: { path: '$lastMessageDetails', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'participants',
                    foreignField: '_id',
                    as: 'participantDetails'
                }
            },
            {
                $lookup: {
                    from: 'messages',
                    let: { roomId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$chatRoomId', '$$roomId'] },
                                        { $not: { $in: [userId, '$readBy'] } }
                                    ]
                                }
                            }
                        },
                        { $count: 'count' }
                    ],
                    as: 'unreadInfo'
                }
            },
            {
                $lookup: {
                    from: 'messages',
                    let: { roomId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$chatRoomId', '$$roomId'] } } },
                        { $count: 'count' }
                    ],
                    as: 'totalMessagesInfo'
                }
            },
            {
                $lookup: {
                    from: 'messages',
                    let: { roomId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$chatRoomId', '$$roomId'] } } },
                        { $sort: { createdAt: -1 } },
                        { $limit: 5 },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'sender',
                                foreignField: '_id',
                                as: 'senderDetails'
                            }
                        },
                        { $unwind: { path: '$senderDetails', preserveNullAndEmptyArrays: true } }
                    ],
                    as: 'recentMessages'
                }
            },
            {
                $project: {
                    _id: 1,
                    isActive: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    participants: 1,
                    participantDetails: 1,
                    lastMessageDetails: 1,
                    recentMessages: 1,
                    unreadCount: { $ifNull: [{ $arrayElemAt: ['$unreadInfo.count', 0] }, 0] },
                    messageCount: { $ifNull: [{ $arrayElemAt: ['$totalMessagesInfo.count', 0] }, 0] }
                }
            }
        ]);
        if (!conversationAgg.length) {
            return next(new AppError_1.default('Conversation not found', 404));
        }
        const participantIds = extractParticipantIdsFromRooms(conversationAgg);
        const profilePictureMap = yield buildProfilePictureMap(participantIds);
        const formatted = transformConversation(conversationAgg[0], userId.toString(), profilePictureMap);
        if (userRole === user_model_1.UserRole.PROVIDER && (formatted === null || formatted === void 0 ? void 0 : formatted.counterpartRole) !== user_model_1.UserRole.ADMIN) {
            return next(new AppError_1.default('Providers can only access admin conversations', 403, 'ROLE_ERROR'));
        }
        res.status(200).json(formatResponse(formatted));
    }
    catch (error) {
        next(error);
    }
});
exports.getConversationById = getConversationById;
// 3. GET MESSAGES
const getConversationMessages = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { conversationId } = req.params;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || '';
        const userRole = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) || '';
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        yield assertConversationAccess(conversationId, userId, userRole);
        const messages = yield message_model_1.Message.find({ chatRoomId: conversationId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender', 'fullName email role profilePic googlePicture');
        const senderIds = Array.from(new Set(messages
            .map((msg) => { var _a, _b, _c; return (_c = (_b = (_a = msg === null || msg === void 0 ? void 0 : msg.sender) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString) === null || _c === void 0 ? void 0 : _c.call(_b); })
            .filter((id) => Boolean(id))));
        const profilePictureMap = yield buildProfilePictureMap(senderIds);
        const formattedMessages = messages.map(msg => {
            const sender = msg.sender;
            const isRead = msg.readBy.length > 1;
            return {
                id: msg._id,
                conversationId: msg.chatRoomId,
                senderId: sender._id,
                type: msg.messageType || 'TEXT',
                content: msg.content,
                attachmentUrl: msg.imageUrl || null,
                isRead: isRead,
                readAt: isRead ? msg.updatedAt : null,
                deletedAt: null,
                createdAt: msg.createdAt,
                updatedAt: msg.updatedAt,
                sender: {
                    id: sender._id,
                    email: sender.email,
                    role: sender.role,
                    profile: {
                        fullName: sender.fullName,
                        profilePicture: sender.profilePic ||
                            sender.googlePicture ||
                            profilePictureMap.get(sender._id.toString()) ||
                            null
                    }
                }
            };
        });
        res.status(200).json(formatResponse({
            messages: formattedMessages.reverse(),
            cursor: null,
            hasMore: messages.length === limit
        }));
    }
    catch (error) {
        next(error);
    }
});
exports.getConversationMessages = getConversationMessages;
// 4. START Conversation
const startConversation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { providerId } = req.body;
        const customerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        let room = yield chatRoom_model_1.ChatRoom.findOne({
            participants: { $all: [customerId, providerId] }
        });
        if (!room) {
            room = yield chatRoom_model_1.ChatRoom.create({
                participants: [customerId, providerId],
                isActive: true
            });
        }
        req.params.conversationId = room._id.toString();
        return (0, exports.getConversationById)(req, res, next);
    }
    catch (error) {
        next(error);
    }
});
exports.startConversation = startConversation;
// 5. MARK READ (Updated to PATCH /read response format)
const markRoomAsRead = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { conversationId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const userRole = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) || '';
        yield assertConversationAccess(conversationId, userId, userRole);
        yield message_model_1.Message.updateMany({ chatRoomId: conversationId, readBy: { $ne: userId } }, { $addToSet: { readBy: userId } });
        res.status(200).json({ success: true, message: 'Marked as read' });
    }
    catch (error) {
        next(error);
    }
});
exports.markRoomAsRead = markRoomAsRead;
// 6. ARCHIVE CONVERSATION
const archiveConversation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { conversationId } = req.params;
        const { status } = req.body; // Expecting "ARCHIVED"
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || '';
        const userRole = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) || '';
        yield assertConversationAccess(conversationId, userId, userRole);
        const isActive = status !== 'ARCHIVED';
        // Update the room
        const room = yield chatRoom_model_1.ChatRoom.findByIdAndUpdate(conversationId, { isActive: isActive }, { new: true });
        if (!room) {
            return next(new AppError_1.default('Conversation not found', 404));
        }
        // Return standard response format (could return the full object, but succcess is usually enough)
        res.status(200).json({
            success: true,
            data: {
                id: room._id,
                status: room.isActive ? 'ACTIVE' : 'ARCHIVED',
                updatedAt: room.updatedAt
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.archiveConversation = archiveConversation;
// 7. SEND MESSAGE (TEXT + IMAGE)
const sendMessageWithImage = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const body = req.body || {};
        let { receiverId, text } = body;
        const senderId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const senderRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        const routePath = (req.path || '').toLowerCase();
        const isCustomerToProvider = routePath.endsWith('/customer-to-provider');
        const isProviderAdminThread = routePath.endsWith('/provider-to-admin');
        const isCustomerToAdmin = routePath.endsWith('/customer-to-admin');
        const isAdminToCustomer = routePath.endsWith('/admin-to-customer');
        // If 'Text' (capitalized) is sent from Postman form-data, accept it
        if (!text && body.Text)
            text = body.Text;
        const file = req.file; // From multer
        // Validation
        if (!text && !file) {
            return next(new AppError_1.default('Message must contain text or image', 400));
        }
        if (!senderId || !senderRole) {
            return next(new AppError_1.default('Authentication required', 401, 'AUTH_ERROR'));
        }
        // Provider -> Admin convenience: if frontend does not have admin id yet, auto-resolve it.
        if (!receiverId && isProviderAdminThread && senderRole === user_model_1.UserRole.PROVIDER) {
            const admin = yield findPrimaryAdmin();
            if (!admin) {
                return next(new AppError_1.default('No admin account is available for chat', 503, 'ADMIN_NOT_AVAILABLE'));
            }
            receiverId = admin.id;
        }
        // Customer -> Admin convenience: auto-resolve admin id if not provided
        if (!receiverId && isCustomerToAdmin && senderRole === user_model_1.UserRole.CUSTOMER) {
            const admin = yield findPrimaryAdmin();
            if (!admin) {
                return next(new AppError_1.default('No admin account is available for chat', 503, 'ADMIN_NOT_AVAILABLE'));
            }
            receiverId = admin.id;
        }
        if (!receiverId) {
            return next(new AppError_1.default('Receiver ID is required', 400));
        }
        if (!mongoose_1.Types.ObjectId.isValid(receiverId)) {
            return next(new AppError_1.default('Invalid receiver id', 400, 'VALIDATION_ERROR'));
        }
        const receiver = yield user_model_1.User.findById(receiverId).select('role');
        if (!receiver) {
            return next(new AppError_1.default('Receiver not found', 404, 'NOT_FOUND_ERROR'));
        }
        const receiverRole = receiver.role;
        if (isCustomerToProvider && (senderRole !== user_model_1.UserRole.CUSTOMER || receiverRole !== user_model_1.UserRole.PROVIDER)) {
            return next(new AppError_1.default('This endpoint only allows customer to provider messaging', 403, 'ROLE_ERROR'));
        }
        if (isProviderAdminThread &&
            !((senderRole === user_model_1.UserRole.PROVIDER && receiverRole === user_model_1.UserRole.ADMIN) ||
                (senderRole === user_model_1.UserRole.ADMIN && receiverRole === user_model_1.UserRole.PROVIDER))) {
            return next(new AppError_1.default('This endpoint only allows provider and admin messaging', 403, 'ROLE_ERROR'));
        }
        if (isCustomerToAdmin && (senderRole !== user_model_1.UserRole.CUSTOMER || receiverRole !== user_model_1.UserRole.ADMIN)) {
            return next(new AppError_1.default('This endpoint only allows customer to admin messaging', 403, 'ROLE_ERROR'));
        }
        if (isAdminToCustomer && (senderRole !== user_model_1.UserRole.ADMIN || receiverRole !== user_model_1.UserRole.CUSTOMER)) {
            return next(new AppError_1.default('This endpoint only allows admin to customer messaging', 403, 'ROLE_ERROR'));
        }
        if (senderRole === user_model_1.UserRole.PROVIDER && receiverRole !== user_model_1.UserRole.ADMIN) {
            return next(new AppError_1.default('Providers can only message admins', 403, 'ROLE_ERROR'));
        }
        // 1. Determine Chat Room (Find or Create)
        let room = yield chatRoom_model_1.ChatRoom.findOne({
            participants: { $all: [senderId, receiverId] }
        });
        if (!room) {
            room = yield chatRoom_model_1.ChatRoom.create({
                participants: [senderId, receiverId],
                isActive: true
            });
        }
        // 2. Upload Image if present
        let imageUrl = null;
        if (file) {
            imageUrl = yield new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.default.cloudinary.uploader.upload_stream({ folder: 'chat_images' }, (error, result) => {
                    if (error)
                        return reject(error);
                    resolve((result === null || result === void 0 ? void 0 : result.secure_url) || null);
                });
                uploadStream.end(file.buffer);
            });
        }
        // 3. Determine Message Type
        let messageType = 'TEXT';
        if (imageUrl && !text)
            messageType = 'IMAGE';
        else if (imageUrl && text)
            messageType = 'MIXED';
        // 4. Save Message
        const message = yield message_model_1.Message.create({
            chatRoomId: room._id,
            sender: senderId,
            content: text || '',
            imageUrl: imageUrl,
            messageType: messageType,
            readBy: [] // Initially unread
        });
        // 5. Update Room Last Message
        yield chatRoom_model_1.ChatRoom.findByIdAndUpdate(room._id, {
            lastMessage: message._id,
            isActive: true,
        });
        // 6. Return Response
        res.status(201).json({
            success: true,
            data: {
                messageId: message._id,
                status: 'pending',
                imageUrl: imageUrl,
                text: text,
                createdAt: message.createdAt
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.sendMessageWithImage = sendMessageWithImage;
// =====================================================================
// ADMIN ↔ CUSTOMER DEDICATED FUNCTIONS
// =====================================================================
// 8. ADMIN: Get all customer conversations (admin inbox filtered to customers only)
const getAdminCustomerConversations = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = new mongoose_1.Types.ObjectId((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId);
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        if (userRole !== user_model_1.UserRole.ADMIN) {
            return next(new AppError_1.default('Only admins can access this endpoint', 403, 'ROLE_ERROR'));
        }
        // Get all conversations where admin is a participant and the other participant is a CUSTOMER
        const conversations = yield chatRoom_model_1.ChatRoom.aggregate([
            { $match: { participants: userId, isActive: true } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'participants',
                    foreignField: '_id',
                    as: 'participantDetails'
                }
            },
            // Only keep rooms where one participant is a CUSTOMER
            {
                $match: {
                    'participantDetails.role': user_model_1.UserRole.CUSTOMER
                }
            },
            // Exclude rooms that have a PROVIDER participant (those are provider-admin rooms)
            {
                $match: {
                    'participantDetails.role': { $ne: user_model_1.UserRole.PROVIDER }
                }
            },
            {
                $lookup: {
                    from: 'messages',
                    localField: 'lastMessage',
                    foreignField: '_id',
                    as: 'lastMessageDetails'
                }
            },
            { $unwind: { path: '$lastMessageDetails', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'messages',
                    let: { roomId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$chatRoomId', '$$roomId'] },
                                        { $not: { $in: [userId, '$readBy'] } }
                                    ]
                                }
                            }
                        },
                        { $count: 'count' }
                    ],
                    as: 'unreadInfo'
                }
            },
            {
                $lookup: {
                    from: 'messages',
                    let: { roomId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$chatRoomId', '$$roomId'] } } },
                        { $count: 'count' }
                    ],
                    as: 'totalMessagesInfo'
                }
            },
            {
                $lookup: {
                    from: 'messages',
                    let: { roomId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$chatRoomId', '$$roomId'] } } },
                        { $sort: { createdAt: -1 } },
                        { $limit: 5 },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'sender',
                                foreignField: '_id',
                                as: 'senderDetails'
                            }
                        },
                        { $unwind: { path: '$senderDetails', preserveNullAndEmptyArrays: true } }
                    ],
                    as: 'recentMessages'
                }
            },
            {
                $project: {
                    _id: 1,
                    isActive: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    participants: 1,
                    participantDetails: 1,
                    lastMessageDetails: 1,
                    recentMessages: 1,
                    unreadCount: { $ifNull: [{ $arrayElemAt: ['$unreadInfo.count', 0] }, 0] },
                    messageCount: { $ifNull: [{ $arrayElemAt: ['$totalMessagesInfo.count', 0] }, 0] }
                }
            },
            { $sort: { updatedAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);
        const participantIds = extractParticipantIdsFromRooms(conversations);
        const profilePictureMap = yield buildProfilePictureMap(participantIds);
        const formattedConversations = conversations.map(c => transformConversation(c, userId.toString(), profilePictureMap));
        res.status(200).json(formatResponse({
            conversations: formattedConversations,
            total: formattedConversations.length,
            page,
            limit,
            hasMore: formattedConversations.length === limit
        }));
    }
    catch (error) {
        next(error);
    }
});
exports.getAdminCustomerConversations = getAdminCustomerConversations;
// 9. CUSTOMER: Start or get conversation with admin (auto-resolves admin)
const startCustomerAdminConversation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const customerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const customerRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (customerRole !== user_model_1.UserRole.CUSTOMER) {
            return next(new AppError_1.default('Only customers can use this endpoint', 403, 'ROLE_ERROR'));
        }
        const admin = yield findPrimaryAdmin();
        if (!admin) {
            return next(new AppError_1.default('No admin available for chat', 503, 'ADMIN_NOT_AVAILABLE'));
        }
        const customerObjectId = new mongoose_1.Types.ObjectId(customerId);
        const adminObjectId = new mongoose_1.Types.ObjectId(admin.id);
        const room = yield ensureAdminCustomerConversation(adminObjectId, customerObjectId);
        req.params.conversationId = room._id.toString();
        return (0, exports.getConversationById)(req, res, next);
    }
    catch (error) {
        next(error);
    }
});
exports.startCustomerAdminConversation = startCustomerAdminConversation;
// 10. ADMIN: Start or get conversation with a specific customer
const startAdminCustomerConversation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const adminRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        const { customerId } = req.body;
        if (adminRole !== user_model_1.UserRole.ADMIN) {
            return next(new AppError_1.default('Only admins can use this endpoint', 403, 'ROLE_ERROR'));
        }
        if (!customerId || !mongoose_1.Types.ObjectId.isValid(customerId)) {
            return next(new AppError_1.default('Valid customerId is required', 400, 'VALIDATION_ERROR'));
        }
        const customer = yield user_model_1.User.findById(customerId).select('role isActive');
        if (!customer) {
            return next(new AppError_1.default('Customer not found', 404, 'NOT_FOUND_ERROR'));
        }
        if (customer.role !== user_model_1.UserRole.CUSTOMER) {
            return next(new AppError_1.default('Target user is not a customer', 400, 'VALIDATION_ERROR'));
        }
        const adminObjectId = new mongoose_1.Types.ObjectId(adminId);
        const customerObjectId = new mongoose_1.Types.ObjectId(customerId);
        const room = yield ensureAdminCustomerConversation(adminObjectId, customerObjectId);
        req.params.conversationId = room._id.toString();
        return (0, exports.getConversationById)(req, res, next);
    }
    catch (error) {
        next(error);
    }
});
exports.startAdminCustomerConversation = startAdminCustomerConversation;
// 11. ADMIN: Get all customers list (for starting new conversations)
const getCustomersForChat = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const adminRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        const adminId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
        const search = req.query.search || '';
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        if (adminRole !== user_model_1.UserRole.ADMIN) {
            return next(new AppError_1.default('Only admins can access this endpoint', 403, 'ROLE_ERROR'));
        }
        const searchFilter = search
            ? {
                $or: [
                    { fullName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }
            : {};
        const customers = yield user_model_1.User.find(Object.assign({ role: user_model_1.UserRole.CUSTOMER, isActive: true }, searchFilter))
            .select('_id fullName email profilePic googlePicture createdAt')
            .sort({ fullName: 1 })
            .skip(skip)
            .limit(limit)
            .lean();
        const adminObjectId = new mongoose_1.Types.ObjectId(adminId);
        const customerIds = customers.map((c) => new mongoose_1.Types.ObjectId(c._id));
        // Check which customers already have a conversation with this admin
        const existingRooms = yield chatRoom_model_1.ChatRoom.find({
            participants: adminObjectId
        }).select('participants').lean();
        const existingCustomerIds = new Set();
        for (const room of existingRooms) {
            for (const participantId of room.participants) {
                const pid = participantId.toString();
                if (pid !== adminId) {
                    existingCustomerIds.add(pid);
                }
            }
        }
        const profiles = yield profile_model_1.Profile.find({ userId: { $in: customerIds } })
            .select('userId profilePic avatar')
            .lean();
        const profileMap = new Map();
        for (const p of profiles) {
            const uid = (_d = (_c = p === null || p === void 0 ? void 0 : p.userId) === null || _c === void 0 ? void 0 : _c.toString) === null || _d === void 0 ? void 0 : _d.call(_c);
            const pic = (p === null || p === void 0 ? void 0 : p.profilePic) || (p === null || p === void 0 ? void 0 : p.avatar) || '';
            if (uid && pic)
                profileMap.set(uid, pic);
        }
        const formattedCustomers = customers.map((c) => {
            const cid = c._id.toString();
            return {
                id: c._id,
                fullName: c.fullName,
                email: c.email,
                profilePicture: c.profilePic || c.googlePicture || profileMap.get(cid) || null,
                hasExistingConversation: existingCustomerIds.has(cid),
                createdAt: c.createdAt
            };
        });
        res.status(200).json(formatResponse({
            customers: formattedCustomers,
            total: formattedCustomers.length,
            page,
            limit,
            hasMore: formattedCustomers.length === limit
        }));
    }
    catch (error) {
        next(error);
    }
});
exports.getCustomersForChat = getCustomersForChat;
