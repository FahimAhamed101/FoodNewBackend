import mongoose, { Types } from 'mongoose';
import { MealToken, MealTokenStatus, IMealToken } from '../models/mealToken.model';
import { Order, OrderStatus, PaymentStatus as OrderPaymentStatus } from '../models/order.model';
import { Payment, PaymentStatus } from '../models/payment.model';
import { Profile } from '../models/profile.model';
import { State } from '../models/state.model';
import { User } from '../models/user.model';
import stripe from '../config/stripe';
import systemConfigService from './systemConfig.service';
import AppError from '../utils/AppError';

const PRICE_PER_MEAL = 5.99;
const PLATFORM_FEE_PER_MEAL = 0.50;

class MealTokenService {
    private roundMoney(value: number): number {
        return Number.isFinite(value) ? parseFloat(value.toFixed(2)) : 0;
    }


    async calculateDonationBreakdown(donorUserId: string, mealCount: number) {
        if (!Number.isInteger(mealCount) || mealCount < 1) {
            throw new AppError('Meal count must be a positive integer', 400, 'INVALID_MEAL_COUNT');
        }

        const profile = await Profile.findOne({ userId: new Types.ObjectId(donorUserId) });
        let stateTaxRate = 0;
        let state = '';

        if (profile?.state) {
            state = profile.state;
            const stateData = await State.findOne({
                $or: [
                    { code: profile.state.toUpperCase() },
                    { name: new RegExp(`^${profile.state}$`, 'i') },
                ],
                isActive: true,
            });
            if (stateData?.tax) {
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
    }

    async createDonationPaymentIntent(donorUserId: string, mealCount: number) {
        const breakdown = await this.calculateDonationBreakdown(donorUserId, mealCount);

        const paymentIntent = await stripe.paymentIntents.create({
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
    }

    async handleDonationPaymentSuccess(paymentIntentId: string) {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        const meta = paymentIntent.metadata;

        if (meta.type !== 'meal_donation') {
            throw new AppError('Not a meal donation payment', 400, 'INVALID_PAYMENT_TYPE');
        }

        // Idempotency — check if already processed
        const existing = await Order.findOne({ stripePaymentIntentId: paymentIntentId });
        if (existing) {
            const existingTokens = await MealToken.find({ donationOrderId: existing._id });
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
        const session = await mongoose.startSession();

        try {
            const result = await session.withTransaction(async () => {
                // Step 1: Create donation order record
                const [order] = await Order.create([{
                    customerId: new Types.ObjectId(donorUserId),
                    providerId: new Types.ObjectId(donorUserId),
                    items: [],
                    subtotal: this.roundMoney(pricePerMeal * mealCount),
                    platformFee,
                    stateTax,
                    donationAmount: total,
                    isDonation: true,
                    totalPrice: total,
                    vendorAmount: 0,
                    state,
                    status: OrderStatus.COMPLETED,
                    paymentStatus: OrderPaymentStatus.PAID,
                    paymentMethod: 'stripe',
                    logisticsType: 'donation',
                    orderId: `DON-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                    stripePaymentIntentId: paymentIntentId,
                    idempotencyKey: paymentIntentId,
                }], { session });

                // Step 2: Create Payment record
                await Payment.create([{
                    paymentId: `PAY-DON-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                    orderId: order.orderId,
                    orderObjectId: order._id,
                    providerId: new Types.ObjectId(donorUserId),
                    customerId: new Types.ObjectId(donorUserId),
                    totalAmount: total,
                    donationAmount: total,
                    commission: platformFee,
                    netAmount: 0,
                    vendorAmount: 0,
                    status: PaymentStatus.COMPLETED,
                    payoutStatus: 'pending',
                    paymentMethod: 'stripe',
                    stripePaymentIntentId: paymentIntentId,
                }], { session });

                // Step 3: Create MealToken(s) — bulk insert for performance
                const tokenDocs = [];
                for (let i = 0; i < mealCount; i++) {
                    tokenDocs.push({
                        tokenId: `TKN-${Date.now()}-${i}-${Math.floor(Math.random() * 10000)}`,
                        donorUserId: new Types.ObjectId(donorUserId),
                        donationOrderId: order._id,
                        mealCount: 1,
                        pricePerMeal,
                        platformFee: this.roundMoney(PLATFORM_FEE_PER_MEAL),
                        stateTax: this.roundMoney(stateTax / mealCount),
                        totalPaid: this.roundMoney(total / mealCount),
                        status: MealTokenStatus.AVAILABLE,
                    });
                }

                const tokens = await MealToken.insertMany(tokenDocs, { session });

                return { order, tokens, mealCount };
            });

            return result;

        } finally {
            // ✅ Always cleanup session
            await session.endSession();
        }
    }


    async getMyTokens(donorUserId: string) {
        const tokens = await MealToken.find({ donorUserId: new Types.ObjectId(donorUserId) })
            .sort({ createdAt: -1 })
            .lean();

        const available = tokens.filter(t => t.status === MealTokenStatus.AVAILABLE).length;
        const claimed = tokens.filter(t => t.status === MealTokenStatus.CLAIMED).length;

        return {
            tokens,
            summary: {
                total: tokens.length,
                available,
                claimed,
            },
        };
    }


    async getAvailableTokenCount() {
        const tokens = await MealToken.find(
            { status: MealTokenStatus.AVAILABLE },
            { tokenId: 1, pricePerMeal: 1, platformFee: 1, createdAt: 1, _id: 0 }
        )
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
    }


    async claimFreeMeal(claimerUserId: string, tokenId: string) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todayClaimed = await MealToken.countDocuments({
            claimedByUserId: new Types.ObjectId(claimerUserId),
            claimedAt: { $gte: todayStart, $lte: todayEnd },
            status: MealTokenStatus.CLAIMED,
        });

        if (todayClaimed >= 100) {
            throw new AppError(
                'You have reached the daily limit of 100 free meals',
                400,
                'DAILY_LIMIT_REACHED'
            );
        }

        const token = await MealToken.findOneAndUpdate(
            { tokenId, status: MealTokenStatus.AVAILABLE },
            {
                $set: {
                    status: MealTokenStatus.CLAIMED,
                    claimedByUserId: new Types.ObjectId(claimerUserId),
                    claimedAt: new Date(),
                },
            },
            { new: true }
        );

        if (!token) {
            throw new AppError(
                'Token not found or already claimed',
                404,
                'TOKEN_NOT_FOUND'
            );
        }

        return token;
    }


    async linkTokenToOrder(tokenId: string, orderId: Types.ObjectId) {
        await MealToken.findOneAndUpdate(
            { tokenId },
            { $set: { claimedOrderId: orderId } }
        );
    }

    async placeFreeMealOrder(claimerUserId: string, data: {
        tokenId: string;
        providerId: string;
        foodId: string;
        quantity: number;
    }) {
        const { tokenId, providerId, foodId, quantity } = data;

        if (!quantity || quantity < 1) {
            throw new AppError('Quantity must be at least 1', 400, 'INVALID_QUANTITY');
        }

        // 1. Verify token belongs to this user and is claimed (not yet used for order)
        const token = await MealToken.findOne({
            tokenId,
            claimedByUserId: new Types.ObjectId(claimerUserId),
            status: MealTokenStatus.CLAIMED,
        });

        if (!token) {
            throw new AppError(
                'Token not found or not claimed by you',
                404,
                'TOKEN_NOT_FOUND'
            );
        }

        if (token.claimedOrderId) {
            throw new AppError(
                'This token has already been used for an order',
                400,
                'TOKEN_ALREADY_USED'
            );
        }

        // 2. Check daily limit: 1 order per restaurant per day
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todayOrderFromThisRestaurant = await Order.countDocuments({
            customerId: new Types.ObjectId(claimerUserId),
            providerId: new Types.ObjectId(providerId),
            paymentMethod: 'meal_token',
            createdAt: { $gte: todayStart, $lte: todayEnd },
        });

        if (todayOrderFromThisRestaurant >= 1) {
            throw new AppError(
                'You can only order once per restaurant per day using free meals. Try a different restaurant or come back tomorrow!',
                400,
                'RESTAURANT_DAILY_LIMIT_REACHED'
            );
        }

        // 3. Verify food exists and is available
        const { Food } = await import('../models/food.model');
        const food = await Food.findById(new Types.ObjectId(foodId));

        if (!food) {
            throw new AppError('Food item not found', 404, 'FOOD_NOT_FOUND');
        }
        if (!food.foodAvailability || !food.foodStatus) {
            throw new AppError('Food item is not available', 400, 'FOOD_UNAVAILABLE');
        }

        // 4. Calculate money flow
        // 4. Calculate money flow
        const vendorAmountPerMeal = this.roundMoney(token.pricePerMeal - token.platformFee);
        const vendorAmount = this.roundMoney(vendorAmountPerMeal * quantity);
        const platformFee = this.roundMoney(token.platformFee * quantity);

        // ✅ Start MongoDB transaction for data consistency
        const session = await mongoose.startSession();

        try {
            const result = await session.withTransaction(async () => {
                // Step 1: Create Order — user pays $0, restaurant gets vendorAmount from token
                const [order] = await Order.create([{
                    customerId: new Types.ObjectId(claimerUserId),
                    providerId: new Types.ObjectId(providerId),
                    items: [{
                        foodId: new Types.ObjectId(foodId),
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
                    status: OrderStatus.PENDING,
                    paymentStatus: OrderPaymentStatus.PAID,
                    paymentMethod: 'meal_token',
                    logisticsType: 'delivery',
                    orderId: `FREE-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                }], { session });

                // Step 2: Create Payment record
                await Payment.create([{
                    paymentId: `PAY-FREE-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                    orderId: order.orderId,
                    orderObjectId: order._id,
                    providerId: new Types.ObjectId(providerId),
                    customerId: new Types.ObjectId(claimerUserId),
                    totalAmount: 0,
                    donationAmount: 0,
                    commission: platformFee,
                    netAmount: vendorAmount,
                    vendorAmount,
                    status: PaymentStatus.COMPLETED,
                    payoutStatus: 'pending',
                    paymentMethod: 'meal_token',
                }], { session });

                // Step 3: Link token → order (atomic update with race condition protection)
                const updatedToken = await MealToken.findOneAndUpdate(
                    {
                        tokenId,
                        claimedOrderId: null  // ✅ Extra safety: only update if not already linked
                    },
                    { $set: { claimedOrderId: order._id } },
                    { session, new: true }
                );

                if (!updatedToken) {
                    throw new AppError(
                        'Token was already used by another request',
                        400,
                        'TOKEN_RACE_CONDITION'
                    );
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
            });

            return result;

        } finally {
            // ✅ Always cleanup session
            await session.endSession();
        }
    }


    async adminGetAllTokens(filters: {
        status?: string;
        page: number;
        limit: number;
    }) {
        const { status, page, limit } = filters;
        const skip = (page - 1) * limit;

        const query: any = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const [tokens, total] = await Promise.all([
            MealToken.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('donorUserId', 'fullName email')
                .populate('claimedByUserId', 'fullName email')
                .lean(),
            MealToken.countDocuments(query),
        ]);

        const available = await MealToken.countDocuments({ status: MealTokenStatus.AVAILABLE });
        const claimed = await MealToken.countDocuments({ status: MealTokenStatus.CLAIMED });

        return {
            tokens,
            summary: {
                total: await MealToken.countDocuments(),
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
    }

   
    async hasAvailableFreeMeals(): Promise<boolean> {
        const count = await MealToken.countDocuments({ status: MealTokenStatus.AVAILABLE });
        return count > 0;
    }


    async getDailyQuota(userId: string) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const usedToday = await MealToken.countDocuments({
            claimedByUserId: new Types.ObjectId(userId),
            claimedAt: { $gte: todayStart, $lte: todayEnd },
            status: MealTokenStatus.CLAIMED,
        });

        return {
            dailyLimit: 100,
            usedToday,
            remaining: Math.max(0, 100 - usedToday),
        };
    }
}

export default new MealTokenService();
