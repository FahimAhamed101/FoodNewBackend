import express from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import {
    getConversations,
    getConversationById,
    getConversationMessages,
    startConversation,
    markRoomAsRead,
    archiveConversation,
    sendMessageWithImage,
    // Admin ↔ Customer
    getAdminCustomerConversations,
    startCustomerAdminConversation,
    startAdminCustomerConversation,
    getCustomersForChat,
} from '../controllers/chat.controller';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);

// ─────────────────────────────────────────────
// GENERAL CONVERSATION ROUTES (all roles)
// ─────────────────────────────────────────────

// GET  /api/v1/chat/conversations          → inbox (all conversations for logged-in user)
router.get('/conversations', getConversations);

// POST /api/v1/chat/conversations          → start customer ↔ provider conversation
router.post('/conversations', startConversation);

// GET  /api/v1/chat/conversations/:id      → single conversation detail
router.get('/conversations/:conversationId', getConversationById);

// GET  /api/v1/chat/conversations/:id/messages  → paginated messages
router.get('/conversations/:conversationId/messages', getConversationMessages);

// PATCH /api/v1/chat/conversations/:id/read    → mark all messages as read
router.patch('/conversations/:conversationId/read', markRoomAsRead);

// PATCH /api/v1/chat/conversations/:id/archive → archive / unarchive
router.patch('/conversations/:conversationId/archive', archiveConversation);

// ─────────────────────────────────────────────
// SEND MESSAGE ROUTES
// ─────────────────────────────────────────────

// POST /api/v1/chat/message/customer-to-provider
router.post('/message/customer-to-provider', upload.single('image'), sendMessageWithImage);

// POST /api/v1/chat/message/provider-to-admin
router.post('/message/provider-to-admin', upload.single('image'), sendMessageWithImage);

// POST /api/v1/chat/message/customer-to-admin
router.post('/message/customer-to-admin', upload.single('image'), sendMessageWithImage);

// POST /api/v1/chat/message/admin-to-customer  ← NEW
router.post('/message/admin-to-customer', upload.single('image'), sendMessageWithImage);

// ─────────────────────────────────────────────
// ADMIN ↔ CUSTOMER DEDICATED ROUTES
// ─────────────────────────────────────────────

// GET  /api/v1/chat/admin/customer-conversations
// Admin: see all conversations with customers (filtered inbox)
router.get('/admin/customer-conversations', requireRole(['ADMIN']), getAdminCustomerConversations);

// GET  /api/v1/chat/admin/customers
// Admin: list all customers (with search) to start a new conversation
router.get('/admin/customers', requireRole(['ADMIN']), getCustomersForChat);

// POST /api/v1/chat/admin/start-conversation
// Admin: start or open existing conversation with a specific customer
// Body: { customerId }
router.post('/admin/start-conversation', requireRole(['ADMIN']), startAdminCustomerConversation);

// POST /api/v1/chat/customer/start-admin-conversation
// Customer: start or open existing conversation with admin (auto-resolves admin)
router.post('/customer/start-admin-conversation', requireRole(['CUSTOMER']), startCustomerAdminConversation);

export default router;
