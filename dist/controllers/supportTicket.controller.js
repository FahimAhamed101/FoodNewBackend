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
const supportTicket_service_1 = __importDefault(require("../services/supportTicket.service"));
const catchAsync_1 = require("../utils/catchAsync");
class SupportTicketController {
    constructor() {
        /**
         * Create Ticket (Customer/Provider)
         * POST /api/v1/support/tickets
         */
        this.createTicket = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.userId;
            const ticket = yield supportTicket_service_1.default.createTicket(userId, req.body);
            res.status(201).json({
                success: true,
                message: 'Support ticket created successfully',
                data: ticket
            });
        }));
        /**
         * Get All Tickets (Admin)
         * GET /api/v1/admin/support/tickets
         */
        this.getAdminTickets = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const data = yield supportTicket_service_1.default.getAdminTickets(req.query);
            res.status(200).json({
                success: true,
                data: data
            });
        }));
        /**
         * Get My Tickets (User)
         * GET /api/v1/support/my-tickets
         */
        this.getMyTickets = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.userId;
            const tickets = yield supportTicket_service_1.default.getUserTickets(userId);
            res.status(200).json({
                success: true,
                data: tickets
            });
        }));
        /**
         * Update Ticket (Admin)
         * PATCH /api/v1/admin/support/tickets/:id
         */
        this.updateTicket = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const ticket = yield supportTicket_service_1.default.updateTicket(req.params.id, req.body);
            res.status(200).json({
                success: true,
                message: 'Ticket updated successfully',
                data: ticket
            });
        }));
        /**
         * Get Ticket Details
         * GET /api/v1/support/tickets/:id
         */
        this.getTicket = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const ticket = yield supportTicket_service_1.default.getTicket(req.params.id);
            res.status(200).json({
                success: true,
                data: ticket
            });
        }));
    }
}
exports.default = new SupportTicketController();
