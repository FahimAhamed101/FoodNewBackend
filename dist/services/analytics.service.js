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
const analytics_repository_1 = __importDefault(require("../repositories/analytics.repository"));
const redis_1 = __importDefault(require("../config/redis"));
const systemConfig_service_1 = __importDefault(require("./systemConfig.service"));
class AnalyticsService {
    constructor() {
        this.CACHE_TTL = 3600; // 1 hour
    }
    /**
     * Get Consolidated Analytics Insights
     */
    getProviderInsights(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const pId = new mongoose_1.Types.ObjectId(providerId);
            // Try to get from cache
            const cacheKey = `analytics:insights:${providerId}`;
            try {
                const cachedData = yield redis_1.default.get(cacheKey);
                if (cachedData) {
                    return JSON.parse(cachedData);
                }
            }
            catch (error) {
                console.error('Redis Error:', error);
                // Continue without cache
            }
            // Fetch all metrics in parallel
            const [overview, weeklyStats, userDistributionByCity, categoryMix, hourlyPeakActivity, permissions] = yield Promise.all([
                analytics_repository_1.default.getOverview(pId),
                analytics_repository_1.default.getWeeklyPerformance(pId),
                analytics_repository_1.default.getUserDistributionByCity(pId),
                analytics_repository_1.default.getCategoryMix(pId),
                analytics_repository_1.default.getHourlyPeakActivity(pId),
                systemConfig_service_1.default.getRestaurantDashboardPermissions()
            ]);
            const finalInsights = {
                overview,
                revenuePerformance: weeklyStats.revenuePerformance,
                orderDistribution: weeklyStats.orderDistribution,
                userDistributionByCity: permissions.showUserDistributionByCity ? userDistributionByCity : [],
                categoryMix,
                hourlyPeakActivity,
            };
            // Cache the result
            try {
                yield redis_1.default.setex(cacheKey, this.CACHE_TTL, JSON.stringify(finalInsights));
            }
            catch (error) {
                console.error('Redis Cache Error:', error);
            }
            return finalInsights;
        });
    }
    getOrSetCache(key, fetchFn) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cached = yield redis_1.default.get(key);
                if (cached)
                    return JSON.parse(cached);
            }
            catch (e) {
                console.error('Cache Get Error:', e);
            }
            const data = yield fetchFn();
            try {
                yield redis_1.default.setex(key, this.CACHE_TTL, JSON.stringify(data));
            }
            catch (e) {
                console.error('Cache Set Error:', e);
            }
            return data;
        });
    }
    getOverview(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getOrSetCache(`analytics:overview:${providerId}`, () => analytics_repository_1.default.getOverview(new mongoose_1.Types.ObjectId(providerId)));
        });
    }
    getRevenuePerformance(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getOrSetCache(`analytics:revenue:${providerId}`, () => __awaiter(this, void 0, void 0, function* () {
                const stats = yield analytics_repository_1.default.getWeeklyPerformance(new mongoose_1.Types.ObjectId(providerId));
                return stats.revenuePerformance;
            }));
        });
    }
    getOrderDistribution(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getOrSetCache(`analytics:orders:${providerId}`, () => __awaiter(this, void 0, void 0, function* () {
                const stats = yield analytics_repository_1.default.getWeeklyPerformance(new mongoose_1.Types.ObjectId(providerId));
                return stats.orderDistribution;
            }));
        });
    }
    getUserDistribution(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const permissions = yield systemConfig_service_1.default.getRestaurantDashboardPermissions();
            if (!permissions.showUserDistributionByCity)
                return [];
            return this.getOrSetCache(`analytics:users:${providerId}`, () => analytics_repository_1.default.getUserDistributionByCity(new mongoose_1.Types.ObjectId(providerId)));
        });
    }
    getCategoryMix(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getOrSetCache(`analytics:categories:${providerId}`, () => analytics_repository_1.default.getCategoryMix(new mongoose_1.Types.ObjectId(providerId)));
        });
    }
    getHourlyActivity(providerId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getOrSetCache(`analytics:hourly:${providerId}`, () => analytics_repository_1.default.getHourlyPeakActivity(new mongoose_1.Types.ObjectId(providerId)));
        });
    }
}
exports.default = new AnalyticsService();
