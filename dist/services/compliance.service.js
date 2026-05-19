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
const complianceViolation_model_1 = require("../models/complianceViolation.model");
const food_model_1 = require("../models/food.model");
const user_model_1 = require("../models/user.model");
const AppError_1 = __importDefault(require("../utils/AppError"));
class ComplianceService {
    /**
     * Check if a food item violates alcohol policies
     */
    scanFoodItem(foodId_1, providerId_1, title_1) {
        return __awaiter(this, arguments, void 0, function* (foodId, providerId, title, description = '') {
            const keywords = ['beer', 'wine', 'cocktail', 'alcohol', 'whiskey', 'vodka', 'gin', 'rum', 'tequila'];
            const content = `${title} ${description}`.toLowerCase();
            const detected = keywords.filter(kw => content.includes(kw));
            if (detected.length > 0) {
                // 1. Create violation record
                yield complianceViolation_model_1.ComplianceViolation.create({
                    listingId: foodId,
                    providerId,
                    issue: detected.length > 1 ? 'Multiple alcohol keywords detected' : 'Alcohol keyword detected',
                    detectedKeywords: detected,
                    status: complianceViolation_model_1.ViolationStatus.PENDING,
                    severity: 'High'
                });
                // 2. Count total violations for this provider
                const count = yield complianceViolation_model_1.ComplianceViolation.countDocuments({ providerId });
                // 3. Auto-ban if violation count >= 10
                if (count >= 10) {
                    yield user_model_1.User.findByIdAndUpdate(providerId, {
                        isBlocked: true,
                        blockedReason: 'Automatic ban: Exceeded maximum alcohol compliance violations (10+)'
                    });
                    return { violationFound: true, providerBanned: true, detected };
                }
                return { violationFound: true, providerBanned: false, detected };
            }
            return { violationFound: false, detected: [] };
        });
    }
    /**
     * Get all violations for Admin dashboard
     */
    getAdminViolations(queryParams) {
        return __awaiter(this, void 0, void 0, function* () {
            const { search, status, page = 1, limit = 10 } = queryParams;
            const query = {};
            if (status)
                query.status = status;
            const skip = (Number(page) - 1) * Number(limit);
            const [violations, total] = yield Promise.all([
                complianceViolation_model_1.ComplianceViolation.find(query)
                    .populate('listingId', 'title image')
                    .populate('providerId', 'fullName email')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit))
                    .lean(),
                complianceViolation_model_1.ComplianceViolation.countDocuments(query)
            ]);
            return {
                violations: violations.map((v) => {
                    var _a, _b, _c;
                    return ({
                        id: v._id,
                        Listing: ((_a = v.listingId) === null || _a === void 0 ? void 0 : _a.title) || 'Deleted Item',
                        Image: ((_b = v.listingId) === null || _b === void 0 ? void 0 : _b.image) || null,
                        Restaurant: ((_c = v.providerId) === null || _c === void 0 ? void 0 : _c.fullName) || 'Unknown',
                        Issue: v.issue,
                        Keywords: v.detectedKeywords,
                        Status: v.status,
                        Date: v.createdAt,
                        Severity: v.severity
                    });
                }),
                meta: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            };
        });
    }
    /**
     * Update violation status (e.g., Warn, Remove)
     */
    handleViolationAction(violationId, action) {
        return __awaiter(this, void 0, void 0, function* () {
            const violation = yield complianceViolation_model_1.ComplianceViolation.findById(violationId);
            if (!violation)
                throw new AppError_1.default('Violation record not found', 404);
            if (action === 'Remove') {
                violation.status = complianceViolation_model_1.ViolationStatus.REMOVED;
                // Optionally, actually delete or deactivate the food item
                yield food_model_1.Food.findByIdAndUpdate(violation.listingId, { foodStatus: false });
            }
            else if (action === 'Warn') {
                violation.status = complianceViolation_model_1.ViolationStatus.WARNED;
            }
            yield violation.save();
            return violation;
        });
    }
}
exports.default = new ComplianceService();
