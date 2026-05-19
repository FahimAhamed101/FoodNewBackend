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
const catchAsync_1 = require("../utils/catchAsync");
const adminUser_service_1 = __importDefault(require("../services/adminUser.service"));
const user_model_1 = require("../models/user.model");
class AdminUserController {
    constructor() {
        this.getCustomers = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const filters = {
                status: req.query.status,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                role: user_model_1.UserRole.CUSTOMER
            };
            const result = yield adminUser_service_1.default.getUsersByRole(filters);
            res.status(200).json(Object.assign(Object.assign({ success: true }, result), { meta: {
                    timestamp: new Date().toISOString()
                } }));
        }));
        this.getProviders = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const filters = {
                status: req.query.status,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                role: user_model_1.UserRole.PROVIDER
            };
            const result = yield adminUser_service_1.default.getUsersByRole(filters);
            res.status(200).json(Object.assign(Object.assign({ success: true }, result), { meta: {
                    timestamp: new Date().toISOString()
                } }));
        }));
        this.blockUser = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { userId } = req.params;
            const { reason } = req.body;
            const user = yield adminUser_service_1.default.blockUser(userId, reason || 'No reason provided');
            res.status(200).json({
                success: true,
                message: 'User blocked successfully',
                data: user
            });
        }));
        this.unblockUser = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { userId } = req.params;
            const user = yield adminUser_service_1.default.unblockUser(userId);
            res.status(200).json({
                success: true,
                message: 'User unblocked successfully',
                data: user
            });
        }));
    }
}
exports.default = new AdminUserController();
