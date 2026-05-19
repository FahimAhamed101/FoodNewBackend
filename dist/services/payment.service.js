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
const mongoose_1 = require("mongoose");
const payment_repository_1 = __importDefault(require("../repositories/payment.repository"));
const redis_1 = __importDefault(require("../config/redis"));
const AppError_1 = __importDefault(require("../utils/AppError"));
class PaymentService {
    constructor() {
        this.CACHE_TTL = 1800; // 30 minutes for financial metrics
    }
    /**
     * Get Overview Metrics with Caching
     */
    getOverview(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const pId = new mongoose_1.Types.ObjectId(providerId);
            const cacheKey = `payments:overview:${providerId}`;
            try {
                const cached = yield redis_1.default.get(cacheKey);
                if (cached)
                    return JSON.parse(cached);
            }
            catch (e) {
                console.error('Redis error:', e);
            }
            const metrics = yield payment_repository_1.default.getMetrics(pId);
            try {
                yield redis_1.default.setex(cacheKey, this.CACHE_TTL, JSON.stringify(metrics));
            }
            catch (e) {
                console.error('Redis error:', e);
            }
            return metrics;
        });
    }
    /**
     * Get Payment History
     */
    getPaymentHistory(providerId, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const pId = new mongoose_1.Types.ObjectId(providerId);
            // Enforce maximum limit
            const sanitizedLimit = Math.min(limit, 50);
            return yield payment_repository_1.default.getHistory(pId, page, sanitizedLimit);
        });
    }
    /**
     * Search Payments
     */
    searchPayments(providerId, query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!query || query.length < 3) {
                throw new AppError_1.default('Search query must be at least 3 characters long', 400, 'INVALID_SEARCH_QUERY');
            }
            const pId = new mongoose_1.Types.ObjectId(providerId);
            const results = yield payment_repository_1.default.searchPayments(pId, query);
            if (!results || results.length === 0) {
                throw new AppError_1.default('No payments found matching your query', 404, 'PAYMENTS_NOT_FOUND');
            }
            return results;
        });
    }
}
exports.default = new PaymentService();
