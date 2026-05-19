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
Object.defineProperty(exports, "__esModule", { value: true });
const auditLog_model_1 = require("../models/auditLog.model");
const mongoose_1 = require("mongoose");
class ActivityLogService {
    /**
     * Log a new activity/audit event
     */
    logActivity(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const log = yield auditLog_model_1.AuditLog.create(Object.assign(Object.assign({}, params), { userId: params.userId ? new mongoose_1.Types.ObjectId(params.userId) : undefined, result: params.result || 'success', riskLevel: params.riskLevel || auditLog_model_1.RiskLevel.LOW }));
                return log;
            }
            catch (error) {
                console.error('Error logging activity:', error);
                // We don't throw error here to prevent blocking main business logic
            }
        });
    }
    /**
     * Get activities for Admin (Global)
     */
    getGlobalActivities() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10, filters = {}) {
            const skip = (page - 1) * limit;
            const query = Object.assign({}, filters);
            const [activities, total] = yield Promise.all([
                auditLog_model_1.AuditLog.find(query)
                    .sort({ timestamp: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('userId', 'fullName profilePic role')
                    .lean(),
                auditLog_model_1.AuditLog.countDocuments(query)
            ]);
            return {
                activities,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            };
        });
    }
    /**
     * Get activities for a specific Provider (Restaurant)
     */
    getProviderActivities(providerId_1) {
        return __awaiter(this, arguments, void 0, function* (providerId, page = 1, limit = 10) {
            const skip = (page - 1) * limit;
            // Providers should see:
            // 1. Their own actions
            // 2. Actions related to their restaurant (metadata.providerId matches)
            const query = {
                $or: [
                    { userId: new mongoose_1.Types.ObjectId(providerId) },
                    { 'metadata.providerId': providerId }
                ]
            };
            const [activities, total] = yield Promise.all([
                auditLog_model_1.AuditLog.find(query)
                    .sort({ timestamp: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('userId', 'fullName profilePic role')
                    .lean(),
                auditLog_model_1.AuditLog.countDocuments(query)
            ]);
            return {
                activities,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            };
        });
    }
}
exports.default = new ActivityLogService();
