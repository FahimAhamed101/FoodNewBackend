"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const mongoose_1 = __importStar(require("mongoose"));
const mealToken_model_1 = require("../models/mealToken.model");
const order_model_1 = require("../models/order.model");
const payment_model_1 = require("../models/payment.model");
const profile_model_1 = require("../models/profile.model");
const state_model_1 = require("../models/state.model");
const stripe_1 = __importDefault(require("../config/stripe"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const PRICE_PER_MEAL = 5.99;
const PLATFORM_FEE_PER_MEAL = 0.50;
class MealTokenService {
    roundMoney(value) {
        return Number.isFinite(value) ? parseFloat(value.toFixed(2)) : 0;
    }
    calculateDonationBreakdown(donorUserId, mealCount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Number.isInteger(mealCount) || mealCount < 1) {
                throw new AppError_1.default('Meal count must be a positive integer', 400, 'INVALID_MEAL_COUNT');
            }
            const profile = yield profile_model_1.Profile.findOne({ userId: new mongoose_1.Types.ObjectId(donorUserId) });
            let stateTaxRate = 0;
            let state = '';
            if (profile === null || profile === void 0 ? void 0 : profile.state) {
                state = profile.state;
                const stateData = yield state_model_1.State.findOne({
                    $or: [
                        { code: profile.state.toUpperCase() },
                        { name: new RegExp(`^${profile.state}$`, 'i') },
                    ],
                    isActive: true,
                });
                if (stateData === null || stateData === void 0 ? void 0 : stateData.tax) {
                    stateTaxRate = stateData.tax / 100;
                }
            }
            const subtotal = this.roundMoney(PRICE_PER_MEAL * mealCount);
            const platformFee = this.roundMoney(PLATFORM_FEE_PER_MEAL * mealCount);
            const stateTax = this.roundMoney(subtotal * stateTaxRate);
            const total = this.roundMoney(subtotal + platformFee + stateTax);
            return {
                mealCount,
                pricePerMeal: PRICE_PER_MEAL,
                platformFeePerMeal: PLATFORM_FEE_PER_MEAL,
                subtotal,
                platformFee,
                stateTax,
                stateTaxRate,
                total,
                state,
            };
        });
    }
    createDonationPaymentIntent(donorUserId, mealCount) {
        return __awaiter(this, void 0, void 0, function* () {
            const breakdown = yield this.calculateDonationBreakdown(donorUserId, mealCount);
            const paymentIntent = yield stripe_1.default.paymentIntents.create({
                amount: Math.round(breakdown.total * 100), // cents
                currency: 'usd',
                automatic_payment_methods: { enabled: true },
                metadata: {
                    type: 'meal_donation',
                    donorUserId,
                    mealCount: mealCount.toString(),
                    pricePerMeal: PRICE_PER_MEAL.toString(),
                    platformFee: breakdown.platformFee.toString(),
                    stateTax: breakdown.stateTax.toString(),
                    total: breakdown.total.toString(),
                    state: breakdown.state,
                },
                description: `Meal Donation - ${mealCount} meal(s) by user ${donorUserId}`,
            });
            return {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                breakdown,
            };
        });
    }
    handleDonationPaymentSuccess(paymentIntentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const paymentIntent = yield stripe_1.default.paymentIntents.retrieve(paymentIntentId);
            const meta = paymentIntent.metadata;
            if (meta.type !== 'meal_donation') {
                throw new AppError_1.default('Not a meal donation payment', 400, 'INVALID_PAYMENT_TYPE');
            }
            // Idempotency — check if already processed
            const existing = yield order_model_1.Order.findOne({ stripePaymentIntentId: paymentIntentId });
            if (existing) {
                const existingTokens = yield mealToken_model_1.MealToken.find({ donationOrderId: existing._id });
                return { order: existing, tokens: existingTokens, mealCount: existingTokens.length };
            }
            const donorUserId = meta.donorUserId;
            const mealCount = parseInt(meta.mealCount);
            const pricePerMeal = parseFloat(meta.pricePerMeal);
            const platformFee = parseFloat(meta.platformFee);
            const stateTax = parseFloat(meta.stateTax);
            const total = parseFloat(meta.total);
            const state = meta.state || '';
            // ✅ Start MongoDB transaction for data consistency
            const session = yield mongoose_1.default.startSession();
            try {
                const result = yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    // Step 1: Create donation order record
                    const [order] = yield order_model_1.Order.create([{
                            customerId: new mongoose_1.Types.ObjectId(donorUserId),
                            providerId: new mongoose_1.Types.ObjectId(donorUserId),
                            items: [],
                            subtotal: this.roundMoney(pricePerMeal * mealCount),
                            platformFee,
                            stateTax,
                            donationAmount: total,
                            isDonation: true,
                            totalPrice: total,
                            vendorAmount: 0,
                            state,
                            status: order_model_1.OrderStatus.COMPLETED,
                            paymentStatus: order_model_1.PaymentStatus.PAID,
                            paymentMethod: 'stripe',
                            logisticsType: 'donation',
                            orderId: `DON-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                            stripePaymentIntentId: paymentIntentId,
                            idempotencyKey: paymentIntentId,
                        }], { session });
                    // Step 2: Create Payment record
                    yield payment_model_1.Payment.create([{
                            paymentId: `PAY-DON-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                            orderId: order.orderId,
                            orderObjectId: order._id,
                            providerId: new mongoose_1.Types.ObjectId(donorUserId),
                            customerId: new mongoose_1.Types.ObjectId(donorUserId),
                            totalAmount: total,
                            donationAmount: total,
                            commission: platformFee,
                            netAmount: 0,
                            vendorAmount: 0,
                            status: payment_model_1.PaymentStatus.COMPLETED,
                            payoutStatus: 'pending',
                            paymentMethod: 'stripe',
                            stripePaymentIntentId: paymentIntentId,
                        }], { session });
                    // Step 3: Create MealToken(s) — bulk insert for performance
                    const tokenDocs = [];
                    for (let i = 0; i < mealCount; i++) {
                        tokenDocs.push({
                            tokenId: `TKN-${Date.now()}-${i}-${Math.floor(Math.random() * 10000)}`,
                            donorUserId: new mongoose_1.Types.ObjectId(donorUserId),
                            donationOrderId: order._id,
                            mealCount: 1,
                            pricePerMeal,
                            platformFee: this.roundMoney(PLATFORM_FEE_PER_MEAL),
                            stateTax: this.roundMoney(stateTax / mealCount),
                            totalPaid: this.roundMoney(total / mealCount),
                            status: mealToken_model_1.MealTokenStatus.AVAILABLE,
                        });
                    }
                    const tokens = yield mealToken_model_1.MealToken.insertMany(tokenDocs, { session });
                    return { order, tokens, mealCount };
                }));
                return result;
            }
            finally {
                // ✅ Always cleanup session
                yield session.endSession();
            }
        });
    }
    getMyTokens(donorUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokens = yield mealToken_model_1.MealToken.find({ donorUserId: new mongoose_1.Types.ObjectId(donorUserId) })
                .sort({ createdAt: -1 })
                .lean();
            const available = tokens.filter(t => t.status === mealToken_model_1.MealTokenStatus.AVAILABLE).length;
            const claimed = tokens.filter(t => t.status === mealToken_model_1.MealTokenStatus.CLAIMED).length;
            return {
                tokens,
                summary: {
                    total: tokens.length,
                    available,
                    claimed,
                },
            };
        });
    }
    getAvailableTokenCount() {
        return __awaiter(this, void 0, void 0, function* () {
            const tokens = yield mealToken_model_1.MealToken.find({ status: mealToken_model_1.MealTokenStatus.AVAILABLE }, { tokenId: 1, pricePerMeal: 1, platformFee: 1, createdAt: 1, _id: 0 })
                .sort({ createdAt: 'asc' }) // oldest first — FIFO
                .lean();
            return {
                availableCount: tokens.length,
                hasFreeMeals: tokens.length > 0,
                tokens: tokens.map(t => ({
                    tokenId: t.tokenId,
                    restaurantGets: this.roundMoney(t.pricePerMeal - t.platformFee), // $5.49
                })),
            };
        });
    }
    claimFreeMeal(claimerUserId, tokenId) {
        return __awaiter(this, void 0, void 0, function* () {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            const todayClaimed = yield mealToken_model_1.MealToken.countDocuments({
                claimedByUserId: new mongoose_1.Types.ObjectId(claimerUserId),
                claimedAt: { $gte: todayStart, $lte: todayEnd },
                status: mealToken_model_1.MealTokenStatus.CLAIMED,
            });
            if (todayClaimed >= 100) {
                throw new AppError_1.default('You have reached the daily limit of 100 free meals', 400, 'DAILY_LIMIT_REACHED');
            }
            const token = yield mealToken_model_1.MealToken.findOneAndUpdate({ tokenId, status: mealToken_model_1.MealTokenStatus.AVAILABLE }, {
                $set: {
                    status: mealToken_model_1.MealTokenStatus.CLAIMED,
                    claimedByUserId: new mongoose_1.Types.ObjectId(claimerUserId),
                    claimedAt: new Date(),
                },
            }, { new: true });
            if (!token) {
                throw new AppError_1.default('Token not found or already claimed', 404, 'TOKEN_NOT_FOUND');
            }
            return token;
        });
    }
    linkTokenToOrder(tokenId, orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield mealToken_model_1.MealToken.findOneAndUpdate({ tokenId }, { $set: { claimedOrderId: orderId } });
        });
    }
    placeFreeMealOrder(claimerUserId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tokenId, providerId, foodId, quantity } = data;
            if (!quantity || quantity < 1) {
                throw new AppError_1.default('Quantity must be at least 1', 400, 'INVALID_QUANTITY');
            }
            // 1. Verify token belongs to this user and is claimed (not yet used for order)
            const token = yield mealToken_model_1.MealToken.findOne({
                tokenId,
                claimedByUserId: new mongoose_1.Types.ObjectId(claimerUserId),
                status: mealToken_model_1.MealTokenStatus.CLAIMED,
            });
            if (!token) {
                throw new AppError_1.default('Token not found or not claimed by you', 404, 'TOKEN_NOT_FOUND');
            }
            if (token.claimedOrderId) {
                throw new AppError_1.default('This token has already been used for an order', 400, 'TOKEN_ALREADY_USED');
            }
            // 2. Check daily limit: 1 order per restaurant per day
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            const todayOrderFromThisRestaurant = yield order_model_1.Order.countDocuments({
                customerId: new mongoose_1.Types.ObjectId(claimerUserId),
                providerId: new mongoose_1.Types.ObjectId(providerId),
                paymentMethod: 'meal_token',
                createdAt: { $gte: todayStart, $lte: todayEnd },
            });
            if (todayOrderFromThisRestaurant >= 1) {
                throw new AppError_1.default('You can only order once per restaurant per day using free meals. Try a different restaurant or come back tomorrow!', 400, 'RESTAURANT_DAILY_LIMIT_REACHED');
            }
            // 3. Verify food exists and is available
            const { Food } = yield Promise.resolve().then(() => __importStar(require('../models/food.model')));
            const food = yield Food.findById(new mongoose_1.Types.ObjectId(foodId));
            if (!food) {
                throw new AppError_1.default('Food item not found', 404, 'FOOD_NOT_FOUND');
            }
            if (!food.foodAvailability || !food.foodStatus) {
                throw new AppError_1.default('Food item is not available', 400, 'FOOD_UNAVAILABLE');
            }
            // 4. Calculate money flow
            // 4. Calculate money flow
            const vendorAmountPerMeal = this.roundMoney(token.pricePerMeal - token.platformFee);
            const vendorAmount = this.roundMoney(vendorAmountPerMeal * quantity);
            const platformFee = this.roundMoney(token.platformFee * quantity);
            // ✅ Start MongoDB transaction for data consistency
            const session = yield mongoose_1.default.startSession();
            try {
                const result = yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    // Step 1: Create Order — user pays $0, restaurant gets vendorAmount from token
                    const [order] = yield order_model_1.Order.create([{
                            customerId: new mongoose_1.Types.ObjectId(claimerUserId),
                            providerId: new mongoose_1.Types.ObjectId(providerId),
                            items: [{
                                    foodId: new mongoose_1.Types.ObjectId(foodId),
                                    quantity,
                                    price: token.pricePerMeal,
                                    platformFee: token.platformFee,
                                }],
                            subtotal: this.roundMoney(token.pricePerMeal * quantity),
                            platformFee,
                            stateTax: 0,
                            donationAmount: 0,
                            isDonation: false,
                            totalPrice: 0,
                            vendorAmount,
                            state: '',
                            status: order_model_1.OrderStatus.PENDING,
                            paymentStatus: order_model_1.PaymentStatus.PAID,
                            paymentMethod: 'meal_token',
                            logisticsType: 'delivery',
                            orderId: `FREE-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                        }], { session });
                    // Step 2: Create Payment record
                    yield payment_model_1.Payment.create([{
                            paymentId: `PAY-FREE-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                            orderId: order.orderId,
                            orderObjectId: order._id,
                            providerId: new mongoose_1.Types.ObjectId(providerId),
                            customerId: new mongoose_1.Types.ObjectId(claimerUserId),
                            totalAmount: 0,
                            donationAmount: 0,
                            commission: platformFee,
                            netAmount: vendorAmount,
                            vendorAmount,
                            status: payment_model_1.PaymentStatus.COMPLETED,
                            payoutStatus: 'pending',
                            paymentMethod: 'meal_token',
                        }], { session });
                    // Step 3: Link token → order (atomic update with race condition protection)
                    const updatedToken = yield mealToken_model_1.MealToken.findOneAndUpdate({
                        tokenId,
                        claimedOrderId: null // ✅ Extra safety: only update if not already linked
                    }, { $set: { claimedOrderId: order._id } }, { session, new: true });
                    if (!updatedToken) {
                        throw new AppError_1.default('Token was already used by another request', 400, 'TOKEN_RACE_CONDITION');
                    }
                    return {
                        order,
                        moneyFlow: {
                            userPaid: 0,
                            restaurantGets: vendorAmount,
                            platformKeeps: platformFee,
                            tokenUsed: tokenId,
                        },
                    };
                }));
                return result;
            }
            finally {
                // ✅ Always cleanup session
                yield session.endSession();
            }
        });
    }
    adminGetAllTokens(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const { status, page, limit } = filters;
            const skip = (page - 1) * limit;
            const query = {};
            if (status && status !== 'all') {
                query.status = status;
            }
            const [tokens, total] = yield Promise.all([
                mealToken_model_1.MealToken.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('donorUserId', 'fullName email')
                    .populate('claimedByUserId', 'fullName email')
                    .lean(),
                mealToken_model_1.MealToken.countDocuments(query),
            ]);
            const available = yield mealToken_model_1.MealToken.countDocuments({ status: mealToken_model_1.MealTokenStatus.AVAILABLE });
            const claimed = yield mealToken_model_1.MealToken.countDocuments({ status: mealToken_model_1.MealTokenStatus.CLAIMED });
            return {
                tokens,
                summary: {
                    total: yield mealToken_model_1.MealToken.countDocuments(),
                    available,
                    claimed,
                },
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1,
                },
            };
        });
    }
    hasAvailableFreeMeals() {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield mealToken_model_1.MealToken.countDocuments({ status: mealToken_model_1.MealTokenStatus.AVAILABLE });
            return count > 0;
        });
    }
    getDailyQuota(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            const usedToday = yield mealToken_model_1.MealToken.countDocuments({
                claimedByUserId: new mongoose_1.Types.ObjectId(userId),
                claimedAt: { $gte: todayStart, $lte: todayEnd },
                status: mealToken_model_1.MealTokenStatus.CLAIMED,
            });
            return {
                dailyLimit: 100,
                usedToday,
                remaining: Math.max(0, 100 - usedToday),
            };
        });
    }
}
exports.default = new MealTokenService();
