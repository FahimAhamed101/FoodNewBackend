"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const user_model_1 = require("../models/user.model");
const supportTicket_controller_1 = __importDefault(require("../controllers/supportTicket.controller"));
const router = express_1.default.Router();
// 🔓 Auth Required for all support actions
router.use(authenticate_1.authenticate);
// 👤 User Routes (Customer/Provider)
router.post('/tickets', supportTicket_controller_1.default.createTicket);
router.get('/my-tickets', supportTicket_controller_1.default.getMyTickets);
router.get('/tickets/:id', supportTicket_controller_1.default.getTicket);
// 👑 Admin Routes
router.get('/admin/tickets', (0, requireRole_1.requireRole)([user_model_1.UserRole.ADMIN]), supportTicket_controller_1.default.getAdminTickets);
router.patch('/admin/tickets/:id', (0, requireRole_1.requireRole)([user_model_1.UserRole.ADMIN]), supportTicket_controller_1.default.updateTicket);
exports.default = router;
