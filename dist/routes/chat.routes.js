"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const chat_controller_1 = require("../controllers/chat.controller");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
router.use(authenticate_1.authenticate);
// ─────────────────────────────────────────────
// GENERAL CONVERSATION ROUTES (all roles)
// ─────────────────────────────────────────────
// GET  /api/v1/chat/conversations          → inbox (all conversations for logged-in user)
router.get('/conversations', chat_controller_1.getConversations);
// POST /api/v1/chat/conversations          → start customer ↔ provider conversation
router.post('/conversations', chat_controller_1.startConversation);
// GET  /api/v1/chat/conversations/:id      → single conversation detail
router.get('/conversations/:conversationId', chat_controller_1.getConversationById);
// GET  /api/v1/chat/conversations/:id/messages  → paginated messages
router.get('/conversations/:conversationId/messages', chat_controller_1.getConversationMessages);
// PATCH /api/v1/chat/conversations/:id/read    → mark all messages as read
router.patch('/conversations/:conversationId/read', chat_controller_1.markRoomAsRead);
// PATCH /api/v1/chat/conversations/:id/archive → archive / unarchive
router.patch('/conversations/:conversationId/archive', chat_controller_1.archiveConversation);
// ─────────────────────────────────────────────
// SEND MESSAGE ROUTES
// ─────────────────────────────────────────────
// POST /api/v1/chat/message/customer-to-provider
router.post('/message/customer-to-provider', upload.single('image'), chat_controller_1.sendMessageWithImage);
// POST /api/v1/chat/message/provider-to-admin
router.post('/message/provider-to-admin', upload.single('image'), chat_controller_1.sendMessageWithImage);
// POST /api/v1/chat/message/customer-to-admin
router.post('/message/customer-to-admin', upload.single('image'), chat_controller_1.sendMessageWithImage);
// POST /api/v1/chat/message/admin-to-customer  ← NEW
router.post('/message/admin-to-customer', upload.single('image'), chat_controller_1.sendMessageWithImage);
// ─────────────────────────────────────────────
// ADMIN ↔ CUSTOMER DEDICATED ROUTES
// ─────────────────────────────────────────────
// GET  /api/v1/chat/admin/customer-conversations
// Admin: see all conversations with customers (filtered inbox)
router.get('/admin/customer-conversations', (0, requireRole_1.requireRole)(['ADMIN']), chat_controller_1.getAdminCustomerConversations);
// GET  /api/v1/chat/admin/customers
// Admin: list all customers (with search) to start a new conversation
router.get('/admin/customers', (0, requireRole_1.requireRole)(['ADMIN']), chat_controller_1.getCustomersForChat);
// POST /api/v1/chat/admin/start-conversation
// Admin: start or open existing conversation with a specific customer
// Body: { customerId }
router.post('/admin/start-conversation', (0, requireRole_1.requireRole)(['ADMIN']), chat_controller_1.startAdminCustomerConversation);
// POST /api/v1/chat/customer/start-admin-conversation
// Customer: start or open existing conversation with admin (auto-resolves admin)
router.post('/customer/start-admin-conversation', (0, requireRole_1.requireRole)(['CUSTOMER']), chat_controller_1.startCustomerAdminConversation);
exports.default = router;
