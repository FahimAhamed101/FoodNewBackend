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
const activityLog_service_1 = __importDefault(require("../services/activityLog.service"));
const user_model_1 = require("../models/user.model");
class ActivityLogController {
    constructor() {
        /**
         * Get activities based on user role
         */
        this.getRecentActivities = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const user = req.user;
            let result;
            if (user.role === user_model_1.UserRole.ADMIN) {
                // Admin sees everything
                result = yield activityLog_service_1.default.getGlobalActivities(page, limit);
            }
            else if (user.role === user_model_1.UserRole.PROVIDER) {
                // Provider sees their restaurant's activities
                result = yield activityLog_service_1.default.getProviderActivities(user.id, page, limit);
            }
            else {
                // Customers (for now just their own)
                result = yield activityLog_service_1.default.getGlobalActivities(page, limit, { userId: user.id });
            }
            res.status(200).json({
                success: true,
                data: result.activities,
                pagination: result.pagination
            });
        }));
    }
}
exports.default = new ActivityLogController();
