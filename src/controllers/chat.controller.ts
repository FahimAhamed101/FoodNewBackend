import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middlewares/authenticate';
import { ChatRoom } from '../models/chatRoom.model';
import { Message } from '../models/message.model';
import { Profile } from '../models/profile.model';
import { ProviderProfile } from '../models/providerProfile.model';
import { UserRole, User } from '../models/user.model';
import AppError from '../utils/AppError';
import cloudinaryConfig from '../config/cloudinary';

// ... (Previous imports and helpers remain unchanged - kept implicitly for context)

// --- HELPER: Format Response ---
const formatResponse = (data: any) => ({
    success: true,
    data,
    meta: {
        timestamp: new Date().toISOString()
    }
});

const findPrimaryAdmin = async () => {
    const admin = await User.findOne({
        role: UserRole.ADMIN,
        isActive: true,
        isSuspended: { $ne: true },
    })
        .sort({ createdAt: 1 })
        .select('_id role')
        .lean();

    return admin ? { id: admin._id.toString(), role: admin.role } : null;
};

const ensureProviderAdminConversation = async (providerObjectId: Types.ObjectId) => {
    const admin = await findPrimaryAdmin();
    if (!admin) return null;

    const adminObjectId = new Types.ObjectId(admin.id);
    let room = await ChatRoom.findOne({
        participants: { $all: [providerObjectId, adminObjectId] },
    });

    if (!room) {
        room = await ChatRoom.create({
            participants: [providerObjectId, adminObjectId],
            isActive: true,
        });
    }

    return room;
};

const buildProfilePictureMap = async (userIds: string[]) => {
    const normalizedIds = Array.from(
        new Set(userIds.filter((id) => typeof id === 'string' && Types.ObjectId.isValid(id)))
    );

    if (!normalizedIds.length) return new Map<string, string>();

    const objectIds = normalizedIds.map((id) => new Types.ObjectId(id));
    const [profiles, providerProfiles] = await Promise.all([
        Profile.find({ userId: { $in: objectIds } }).select('userId profilePic avatar').lean(),
        ProviderProfile.find({ providerId: { $in: objectIds } }).select('providerId profile').lean(),
    ]);

    const profilePictureMap = new Map<string, string>();

    for (const profile of profiles as any[]) {
        const profileOwnerId = profile?.userId?.toString?.();
        const image = profile?.profilePic || profile?.avatar || '';
        if (profileOwnerId && image) {
            profilePictureMap.set(profileOwnerId, image);
        }
    }

    for (const providerProfile of providerProfiles as any[]) {
        const providerId = providerProfile?.providerId?.toString?.();
        const image = providerProfile?.profile || '';
        if (providerId && image && !profilePictureMap.has(providerId)) {
            profilePictureMap.set(providerId, image);
        }
    }

    return profilePictureMap;
};

const extractParticipantIdsFromRooms = (rooms: any[]) => {
    const participantIds: string[] = [];
    for (const room of rooms) {
        const participants = Array.isArray(room?.participantDetails) ? room.participantDetails : [];
        for (const participant of participants) {
            const participantId = participant?._id?.toString?.();
            if (participantId) participantIds.push(participantId);
        }
    }
    return Array.from(new Set(participantIds));
};

const formatUser = (user: any, role: string, profilePictureMap?: Map<string, string>) => {
    if (!user) return null;
    const userId = user?._id?.toString?.();
    const resolvedProfilePicture =
        user?.profilePic ||
        user?.googlePicture ||
        (userId ? profilePictureMap?.get(userId) : '') ||
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

const transformConversation = (room: any, currentUserId: string, profilePictureMap?: Map<string, string>) => {
    const participants = Array.isArray(room.participantDetails)
        ? room.participantDetails
        : (Array.isArray(room.participants) ? room.participants : []);

    const customer = participants.find((p: any) => p?.role === UserRole.CUSTOMER);
    const provider = participants.find((p: any) => p?.role === UserRole.PROVIDER);
    const admin = participants.find((p: any) => p?.role === UserRole.ADMIN);
    const me = participants.find((p: any) => p?._id?.toString?.() === currentUserId);

    let counterpart = participants.find((p: any) => p?._id?.toString?.() !== currentUserId) || null;
    if (me?.role === UserRole.PROVIDER && admin) {
        counterpart = admin;
    } else if (me?.role === UserRole.ADMIN && provider) {
        counterpart = provider;
    } else if (me?.role === UserRole.ADMIN && customer && !provider) {
        // Admin ↔ Customer conversation
        counterpart = customer;
    } else if (me?.role === UserRole.CUSTOMER && admin && !provider) {
        // Customer ↔ Admin conversation
        counterpart = admin;
    } else if (me?.role === UserRole.CUSTOMER && provider) {
        counterpart = provider;
    }

    return {
        id: room._id,
        customerId: customer?._id,
        providerId: provider?._id,
        adminId: admin?._id,
        status: room.isActive ? 'ACTIVE' : 'ARCHIVED',
        lastMessageAt: room.lastMessageDetails?.createdAt || room.updatedAt,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        customer: formatUser(customer, UserRole.CUSTOMER, profilePictureMap),
        provider: formatUser(provider, UserRole.PROVIDER, profilePictureMap),
        admin: formatUser(admin, UserRole.ADMIN, profilePictureMap),
        counterpartId: counterpart?._id || null,
        counterpartRole: counterpart?.role || null,
        counterpart: counterpart ? formatUser(counterpart, counterpart.role || 'UNKNOWN', profilePictureMap) : null,
        messages: (room.recentMessages || []).map((msg: any) => ({
            id: msg._id,
            content: msg.content,
            senderId: msg.sender,
            role: msg.senderDetails?.role || 'UNKNOWN',
            type: msg.messageType || 'TEXT',
            attachmentUrl: msg.imageUrl || null,
            createdAt: msg.createdAt
        })).reverse(), // Show in chronological order within the array
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

const assertConversationAccess = async (conversationId: string, userId: string, userRole: string) => {
    if (!Types.ObjectId.isValid(conversationId)) {
        throw new AppError('Invalid conversation id', 400, 'VALIDATION_ERROR');
    }

    const room = await ChatRoom.findById(conversationId).populate('participants', 'role');
    if (!room) {
        throw new AppError('Conversation not found', 404, 'NOT_FOUND_ERROR');
    }

    const participants = Array.isArray(room.participants) ? (room.participants as any[]) : [];
    const isParticipant = participants.some((p) => p?._id?.toString?.() === userId);
    if (!isParticipant) {
        throw new AppError('Not authorized to access this conversation', 403, 'ROLE_ERROR');
    }

    if (userRole === UserRole.PROVIDER) {
        const hasAdminParticipant = participants.some((p) => p?.role === UserRole.ADMIN);
        if (!hasAdminParticipant) {
            throw new AppError('Providers can only access admin conversations', 403, 'ROLE_ERROR');
        }
    }

    // Customer can only access conversations where the other participant is a provider or admin
    if (userRole === UserRole.CUSTOMER) {
        const hasValidCounterpart = participants.some(
            (p) => p?._id?.toString?.() !== userId &&
                (p?.role === UserRole.PROVIDER || p?.role === UserRole.ADMIN)
        );
        if (!hasValidCounterpart) {
            throw new AppError('Customers can only access provider or admin conversations', 403, 'ROLE_ERROR');
        }
    }

    return room;
};

// Helper: ensure admin-customer conversation room exists
const ensureAdminCustomerConversation = async (adminObjectId: Types.ObjectId, customerObjectId: Types.ObjectId) => {
    let room = await ChatRoom.findOne({
        participants: { $all: [adminObjectId, customerObjectId] },
    });

    if (!room) {
        room = await ChatRoom.create({
            participants: [adminObjectId, customerObjectId],
            isActive: true,
        });
    }

    return room;
};

// 1. GET CONVERSATIONS (Inbox)
export const getConversations = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = new Types.ObjectId(req.user?.userId);
        const userRole = req.user?.role;
        const limit = parseInt(req.query.limit as string) || 20;

        if (userRole === UserRole.PROVIDER) {
            await ensureProviderAdminConversation(userId);
        }

        const conversations = await ChatRoom.aggregate([
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
        const profilePictureMap = await buildProfilePictureMap(participantIds);

        let formattedConversations = conversations.map(c =>
            transformConversation(c, userId.toString(), profilePictureMap)
        );
        if (userRole === UserRole.PROVIDER) {
            formattedConversations = formattedConversations.filter(
                (conversation: any) => conversation?.counterpartRole === UserRole.ADMIN
            );
        }

        res.status(200).json(formatResponse({
            conversations: formattedConversations,
            cursor: null,
            hasMore: false
        }));

    } catch (error) {
        next(error);
    }
};

// 2. GET SINGLE CONVERSATION
export const getConversationById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { conversationId } = req.params;
        const userId = new Types.ObjectId(req.user?.userId);
        const userRole = req.user?.role || '';

        await assertConversationAccess(conversationId as string, userId.toString(), userRole);

        const conversationAgg = await ChatRoom.aggregate([
            { $match: { _id: new Types.ObjectId(conversationId as string) } },
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
            return next(new AppError('Conversation not found', 404));
        }

        const participantIds = extractParticipantIdsFromRooms(conversationAgg);
        const profilePictureMap = await buildProfilePictureMap(participantIds);
        const formatted = transformConversation(conversationAgg[0], userId.toString(), profilePictureMap);
        if (userRole === UserRole.PROVIDER && formatted?.counterpartRole !== UserRole.ADMIN) {
            return next(new AppError('Providers can only access admin conversations', 403, 'ROLE_ERROR'));
        }

        res.status(200).json(formatResponse(formatted));
    } catch (error) {
        next(error);
    }
};

// 3. GET MESSAGES
export const getConversationMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user?.userId || '';
        const userRole = req.user?.role || '';
        const limit = parseInt(req.query.limit as string) || 20;
        const page = parseInt(req.query.page as string) || 1;
        const skip = (page - 1) * limit;

        await assertConversationAccess(conversationId as string, userId, userRole);

        const messages = await Message.find({ chatRoomId: conversationId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender', 'fullName email role profilePic googlePicture');

        const senderIds = Array.from(
            new Set(
                messages
                    .map((msg: any) => (msg?.sender as any)?._id?.toString?.())
                    .filter((id): id is string => Boolean(id))
            )
        );
        const profilePictureMap = await buildProfilePictureMap(senderIds);

        const formattedMessages = messages.map(msg => {
            const sender = msg.sender as any;
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
                        profilePicture:
                            sender.profilePic ||
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

    } catch (error) {
        next(error);
    }
};

// 4. START Conversation
export const startConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { providerId } = req.body;
        const customerId = req.user?.userId;

        let room = await ChatRoom.findOne({
            participants: { $all: [customerId, providerId] }
        });

        if (!room) {
            room = await ChatRoom.create({
                participants: [customerId, providerId],
                isActive: true
            });
        }

        req.params.conversationId = room._id.toString();
        return getConversationById(req, res, next);

    } catch (error) {
        next(error);
    }
};

// 5. MARK READ (Updated to PATCH /read response format)
export const markRoomAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user?.userId;
        const userRole = req.user?.role || '';

        await assertConversationAccess(conversationId as string, userId as string, userRole);

        await Message.updateMany(
            { chatRoomId: conversationId, readBy: { $ne: userId } },
            { $addToSet: { readBy: userId } }
        );

        res.status(200).json({ success: true, message: 'Marked as read' });
    } catch (error) {
        next(error);
    }
};

// 6. ARCHIVE CONVERSATION
export const archiveConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { conversationId } = req.params;
        const { status } = req.body; // Expecting "ARCHIVED"
        const userId = req.user?.userId || '';
        const userRole = req.user?.role || '';

        await assertConversationAccess(conversationId as string, userId, userRole);

        const isActive = status !== 'ARCHIVED';

        // Update the room
        const room = await ChatRoom.findByIdAndUpdate(
            conversationId,
            { isActive: isActive },
            { new: true }
        );

        if (!room) {
            return next(new AppError('Conversation not found', 404));
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

    } catch (error) {
        next(error);
    }
};

// 7. SEND MESSAGE (TEXT + IMAGE)
export const sendMessageWithImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const body = req.body || {};
        let { receiverId, text } = body;
        const senderId = req.user?.userId;
        const senderRole = req.user?.role;
        const routePath = (req.path || '').toLowerCase();
        const isCustomerToProvider = routePath.endsWith('/customer-to-provider');
        const isProviderAdminThread = routePath.endsWith('/provider-to-admin');
        const isCustomerToAdmin = routePath.endsWith('/customer-to-admin');
        const isAdminToCustomer = routePath.endsWith('/admin-to-customer');

        // If 'Text' (capitalized) is sent from Postman form-data, accept it
        if (!text && body.Text) text = body.Text;

        const file = req.file; // From multer

        // Validation
        if (!text && !file) {
            return next(new AppError('Message must contain text or image', 400));
        }

        if (!senderId || !senderRole) {
            return next(new AppError('Authentication required', 401, 'AUTH_ERROR'));
        }

        // Provider -> Admin convenience: if frontend does not have admin id yet, auto-resolve it.
        if (!receiverId && isProviderAdminThread && senderRole === UserRole.PROVIDER) {
            const admin = await findPrimaryAdmin();
            if (!admin) {
                return next(new AppError('No admin account is available for chat', 503, 'ADMIN_NOT_AVAILABLE'));
            }
            receiverId = admin.id;
        }

        // Customer -> Admin convenience: auto-resolve admin id if not provided
        if (!receiverId && isCustomerToAdmin && senderRole === UserRole.CUSTOMER) {
            const admin = await findPrimaryAdmin();
            if (!admin) {
                return next(new AppError('No admin account is available for chat', 503, 'ADMIN_NOT_AVAILABLE'));
            }
            receiverId = admin.id;
        }

        if (!receiverId) {
            return next(new AppError('Receiver ID is required', 400));
        }

        if (!Types.ObjectId.isValid(receiverId)) {
            return next(new AppError('Invalid receiver id', 400, 'VALIDATION_ERROR'));
        }

        const receiver = await User.findById(receiverId).select('role');
        if (!receiver) {
            return next(new AppError('Receiver not found', 404, 'NOT_FOUND_ERROR'));
        }

        const receiverRole = receiver.role;

        if (isCustomerToProvider && (senderRole !== UserRole.CUSTOMER || receiverRole !== UserRole.PROVIDER)) {
            return next(new AppError('This endpoint only allows customer to provider messaging', 403, 'ROLE_ERROR'));
        }

        if (
            isProviderAdminThread &&
            !(
                (senderRole === UserRole.PROVIDER && receiverRole === UserRole.ADMIN) ||
                (senderRole === UserRole.ADMIN && receiverRole === UserRole.PROVIDER)
            )
        ) {
            return next(new AppError('This endpoint only allows provider and admin messaging', 403, 'ROLE_ERROR'));
        }

        if (isCustomerToAdmin && (senderRole !== UserRole.CUSTOMER || receiverRole !== UserRole.ADMIN)) {
            return next(new AppError('This endpoint only allows customer to admin messaging', 403, 'ROLE_ERROR'));
        }

        if (isAdminToCustomer && (senderRole !== UserRole.ADMIN || receiverRole !== UserRole.CUSTOMER)) {
            return next(new AppError('This endpoint only allows admin to customer messaging', 403, 'ROLE_ERROR'));
        }

        if (senderRole === UserRole.PROVIDER && receiverRole !== UserRole.ADMIN) {
            return next(new AppError('Providers can only message admins', 403, 'ROLE_ERROR'));
        }

        // 1. Determine Chat Room (Find or Create)
        let room = await ChatRoom.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        if (!room) {
            room = await ChatRoom.create({
                participants: [senderId, receiverId],
                isActive: true
            });
        }

        // 2. Upload Image if present
        let imageUrl: any = null;
        if (file) {
            imageUrl = await new Promise((resolve, reject) => {
                const uploadStream = cloudinaryConfig.cloudinary.uploader.upload_stream(
                    { folder: 'chat_images' },
                    (error: any, result: any) => {
                        if (error) return reject(error);
                        resolve(result?.secure_url || null);
                    }
                );
                uploadStream.end(file.buffer);
            });
        }

        // 3. Determine Message Type
        let messageType = 'TEXT';
        if (imageUrl && !text) messageType = 'IMAGE';
        else if (imageUrl && text) messageType = 'MIXED';

        // 4. Save Message
        const message: any = await Message.create({
            chatRoomId: room._id,
            sender: senderId,
            content: text || '',
            imageUrl: imageUrl,
            messageType: messageType,
            readBy: [] // Initially unread
        });

        // 5. Update Room Last Message
        await ChatRoom.findByIdAndUpdate(room._id, {
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

    } catch (error) {
        next(error);
    }
};


// =====================================================================
// ADMIN ↔ CUSTOMER DEDICATED FUNCTIONS
// =====================================================================

// 8. ADMIN: Get all customer conversations (admin inbox filtered to customers only)
export const getAdminCustomerConversations = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = new Types.ObjectId(req.user?.userId);
        const userRole = req.user?.role;
        const limit = parseInt(req.query.limit as string) || 20;
        const page = parseInt(req.query.page as string) || 1;
        const skip = (page - 1) * limit;

        if (userRole !== UserRole.ADMIN) {
            return next(new AppError('Only admins can access this endpoint', 403, 'ROLE_ERROR'));
        }

        // Get all conversations where admin is a participant and the other participant is a CUSTOMER
        const conversations = await ChatRoom.aggregate([
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
                    'participantDetails.role': UserRole.CUSTOMER
                }
            },
            // Exclude rooms that have a PROVIDER participant (those are provider-admin rooms)
            {
                $match: {
                    'participantDetails.role': { $ne: UserRole.PROVIDER }
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
        const profilePictureMap = await buildProfilePictureMap(participantIds);

        const formattedConversations = conversations.map(c =>
            transformConversation(c, userId.toString(), profilePictureMap)
        );

        res.status(200).json(formatResponse({
            conversations: formattedConversations,
            total: formattedConversations.length,
            page,
            limit,
            hasMore: formattedConversations.length === limit
        }));

    } catch (error) {
        next(error);
    }
};

// 9. CUSTOMER: Start or get conversation with admin (auto-resolves admin)
export const startCustomerAdminConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const customerId = req.user?.userId;
        const customerRole = req.user?.role;

        if (customerRole !== UserRole.CUSTOMER) {
            return next(new AppError('Only customers can use this endpoint', 403, 'ROLE_ERROR'));
        }

        const admin = await findPrimaryAdmin();
        if (!admin) {
            return next(new AppError('No admin available for chat', 503, 'ADMIN_NOT_AVAILABLE'));
        }

        const customerObjectId = new Types.ObjectId(customerId);
        const adminObjectId = new Types.ObjectId(admin.id);

        const room = await ensureAdminCustomerConversation(adminObjectId, customerObjectId);

        req.params.conversationId = room._id.toString();
        return getConversationById(req, res, next);

    } catch (error) {
        next(error);
    }
};

// 10. ADMIN: Start or get conversation with a specific customer
export const startAdminCustomerConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const adminId = req.user?.userId;
        const adminRole = req.user?.role;
        const { customerId } = req.body;

        if (adminRole !== UserRole.ADMIN) {
            return next(new AppError('Only admins can use this endpoint', 403, 'ROLE_ERROR'));
        }

        if (!customerId || !Types.ObjectId.isValid(customerId)) {
            return next(new AppError('Valid customerId is required', 400, 'VALIDATION_ERROR'));
        }

        const customer = await User.findById(customerId).select('role isActive');
        if (!customer) {
            return next(new AppError('Customer not found', 404, 'NOT_FOUND_ERROR'));
        }
        if (customer.role !== UserRole.CUSTOMER) {
            return next(new AppError('Target user is not a customer', 400, 'VALIDATION_ERROR'));
        }

        const adminObjectId = new Types.ObjectId(adminId);
        const customerObjectId = new Types.ObjectId(customerId);

        const room = await ensureAdminCustomerConversation(adminObjectId, customerObjectId);

        req.params.conversationId = room._id.toString();
        return getConversationById(req, res, next);

    } catch (error) {
        next(error);
    }
};

// 11. ADMIN: Get all customers list (for starting new conversations)
export const getCustomersForChat = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const adminRole = req.user?.role;
        const adminId = req.user?.userId;
        const search = (req.query.search as string) || '';
        const limit = parseInt(req.query.limit as string) || 20;
        const page = parseInt(req.query.page as string) || 1;
        const skip = (page - 1) * limit;

        if (adminRole !== UserRole.ADMIN) {
            return next(new AppError('Only admins can access this endpoint', 403, 'ROLE_ERROR'));
        }

        const searchFilter = search
            ? {
                $or: [
                    { fullName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }
            : {};

        const customers = await User.find({
            role: UserRole.CUSTOMER,
            isActive: true,
            ...searchFilter
        })
            .select('_id fullName email profilePic googlePicture createdAt')
            .sort({ fullName: 1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const adminObjectId = new Types.ObjectId(adminId);
        const customerIds = customers.map((c: any) => new Types.ObjectId(c._id));

        // Check which customers already have a conversation with this admin
        const existingRooms = await ChatRoom.find({
            participants: adminObjectId
        }).select('participants').lean();

        const existingCustomerIds = new Set<string>();
        for (const room of existingRooms) {
            for (const participantId of room.participants) {
                const pid = participantId.toString();
                if (pid !== adminId) {
                    existingCustomerIds.add(pid);
                }
            }
        }

        const profiles = await Profile.find({ userId: { $in: customerIds } })
            .select('userId profilePic avatar')
            .lean();

        const profileMap = new Map<string, string>();
        for (const p of profiles as any[]) {
            const uid = p?.userId?.toString?.();
            const pic = p?.profilePic || p?.avatar || '';
            if (uid && pic) profileMap.set(uid, pic);
        }

        const formattedCustomers = customers.map((c: any) => {
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

    } catch (error) {
        next(error);
    }
};

