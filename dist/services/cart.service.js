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
const cart_model_1 = require("../models/cart.model");
const food_model_1 = require("../models/food.model");
const providerProfile_model_1 = require("../models/providerProfile.model");
const mongoose_1 = require("mongoose");
const AppError_1 = __importDefault(require("../utils/AppError"));
class CartService {
    roundMoney(value) {
        return Number.isFinite(value) ? parseFloat(value.toFixed(2)) : 0;
    }
    normalizeRate(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric) || numeric <= 0)
            return 0;
        return numeric > 1 ? numeric / 100 : numeric;
    }
    parseFoodObjectId(foodId) {
        if (!foodId || !mongoose_1.Types.ObjectId.isValid(foodId)) {
            throw new AppError_1.default('Invalid food id', 400, 'INVALID_FOOD_ID');
        }
        return new mongoose_1.Types.ObjectId(foodId);
    }
    extractProviderId(cart) {
        var _a;
        const firstItem = Array.isArray(cart === null || cart === void 0 ? void 0 : cart.items) ? cart.items[0] : null;
        const rawProviderId = (_a = firstItem === null || firstItem === void 0 ? void 0 : firstItem.foodId) === null || _a === void 0 ? void 0 : _a.providerId;
        if (!rawProviderId)
            return null;
        try {
            if (rawProviderId instanceof mongoose_1.Types.ObjectId)
                return rawProviderId;
            return new mongoose_1.Types.ObjectId(String(rawProviderId));
        }
        catch (_b) {
            return null;
        }
    }
    getPopulatedCart(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield cart_model_1.Cart.findOne({ userId: new mongoose_1.Types.ObjectId(userId) })
                .populate('items.foodId', 'title image baseRevenue finalPriceTag foodAvailability foodStatus serviceFee providerId')
                .lean();
        });
    }
    enrichCart(cart) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!cart)
                return cart;
            const items = Array.isArray(cart.items) ? cart.items : [];
            const subtotalRaw = typeof cart.subtotal === 'number'
                ? cart.subtotal
                : items.reduce((sum, item) => {
                    const price = Number(item === null || item === void 0 ? void 0 : item.price) || 0;
                    const quantity = Number(item === null || item === void 0 ? void 0 : item.quantity) || 0;
                    return sum + (price * quantity);
                }, 0);
            const subtotal = this.roundMoney(subtotalRaw);
            const providerId = this.extractProviderId(cart);
            const providerProfile = providerId
                ? yield providerProfile_model_1.ProviderProfile.findOne({ providerId })
                    .select('restaurantName restaurantAddress profile cityTax')
                    .lean()
                : null;
            // Use provider cityTax for both state and county tax rows in cart breakdown.
            const cityTaxRate = this.normalizeRate(providerProfile === null || providerProfile === void 0 ? void 0 : providerProfile.cityTax);
            const stateTaxRate = cityTaxRate;
            const countyTaxRate = cityTaxRate;
            const stateTaxAmount = this.roundMoney(subtotal * stateTaxRate);
            const countyTaxAmount = this.roundMoney(subtotal * countyTaxRate);
            const platformFee = this.roundMoney(typeof (cart === null || cart === void 0 ? void 0 : cart.platformFee) === 'number' ? cart.platformFee : 0);
            const total = this.roundMoney(subtotal + platformFee + stateTaxAmount + countyTaxAmount);
            return Object.assign(Object.assign({}, cart), { subtotal,
                platformFee, cityTax: this.roundMoney(cityTaxRate * 100), cityTaxRate,
                stateTaxRate,
                countyTaxRate,
                stateTaxAmount,
                countyTaxAmount,
                total, restaurantName: (providerProfile === null || providerProfile === void 0 ? void 0 : providerProfile.restaurantName) || (cart === null || cart === void 0 ? void 0 : cart.restaurantName) || '', restaurantAddress: (providerProfile === null || providerProfile === void 0 ? void 0 : providerProfile.restaurantAddress) || (cart === null || cart === void 0 ? void 0 : cart.restaurantAddress) || '', restaurantProfile: (providerProfile === null || providerProfile === void 0 ? void 0 : providerProfile.profile) || (cart === null || cart === void 0 ? void 0 : cart.restaurantProfile) || '' });
        });
    }
    /**
     * Get user's cart (create if doesn't exist)
     */
    getCart(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            let cart = yield this.getPopulatedCart(userId);
            if (!cart) {
                yield cart_model_1.Cart.create({
                    userId: new mongoose_1.Types.ObjectId(userId),
                    items: [],
                    subtotal: 0,
                });
                cart = yield this.getPopulatedCart(userId);
            }
            return yield this.enrichCart(cart);
        });
    }
    addToCart(userId, foodId, quantity) {
        return __awaiter(this, void 0, void 0, function* () {
            const foodObjectId = this.parseFoodObjectId(foodId);
            const safeQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
            const food = yield food_model_1.Food.findById(foodObjectId);
            if (!food) {
                throw new AppError_1.default('Food item not found', 404, 'FOOD_NOT_FOUND');
            }
            if (!food.foodAvailability || !food.foodStatus) {
                throw new AppError_1.default('This food item is currently unavailable', 400, 'FOOD_UNAVAILABLE');
            }
            // Find or create cart
            let cart = yield cart_model_1.Cart.findOne({ userId: new mongoose_1.Types.ObjectId(userId) });
            if (!cart) {
                // Create new cart with item
                cart = yield cart_model_1.Cart.create({
                    userId: new mongoose_1.Types.ObjectId(userId),
                    items: [
                        {
                            foodId: foodObjectId,
                            quantity: safeQuantity,
                            price: food.finalPriceTag,
                        },
                    ],
                });
            }
            else {
                // Check if item already exists in cart
                const existingItemIndex = cart.items.findIndex((item) => item.foodId.toString() === foodObjectId.toString());
                if (existingItemIndex !== -1) {
                    // Increment quantity
                    cart.items[existingItemIndex].quantity += safeQuantity;
                }
                else {
                    // Add new item
                    cart.items.push({
                        foodId: foodObjectId,
                        quantity: safeQuantity,
                        price: food.finalPriceTag,
                    });
                }
                yield cart.save();
            }
            return yield this.enrichCart(yield this.getPopulatedCart(userId));
        });
    }
    /**
     * Update item quantity (or remove if quantity = 0)
     */
    updateCartItem(userId, foodId, quantity) {
        return __awaiter(this, void 0, void 0, function* () {
            const foodObjectId = this.parseFoodObjectId(foodId);
            const cart = yield cart_model_1.Cart.findOne({ userId: new mongoose_1.Types.ObjectId(userId) });
            if (!cart) {
                throw new AppError_1.default('Cart not found', 404, 'CART_NOT_FOUND');
            }
            const itemIndex = cart.items.findIndex((item) => item.foodId.toString() === foodObjectId.toString());
            if (itemIndex === -1) {
                throw new AppError_1.default('Item not found in cart', 404, 'ITEM_NOT_FOUND');
            }
            if (quantity === 0) {
                // Remove item
                cart.items.splice(itemIndex, 1);
            }
            else {
                // Update quantity
                cart.items[itemIndex].quantity = Math.max(1, Math.floor(Number(quantity) || 1));
            }
            yield cart.save();
            return yield this.enrichCart(yield this.getPopulatedCart(userId));
        });
    }
    /**
     * Remove specific item from cart
     */
    removeFromCart(userId, foodId) {
        return __awaiter(this, void 0, void 0, function* () {
            const foodObjectId = this.parseFoodObjectId(foodId);
            const cart = yield cart_model_1.Cart.findOne({ userId: new mongoose_1.Types.ObjectId(userId) });
            if (!cart) {
                throw new AppError_1.default('Cart not found', 404, 'CART_NOT_FOUND');
            }
            cart.items = cart.items.filter((item) => item.foodId.toString() !== foodObjectId.toString());
            yield cart.save();
            return yield this.enrichCart(yield this.getPopulatedCart(userId));
        });
    }
    /**
     * Clear entire cart
     */
    clearCart(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const cart = yield cart_model_1.Cart.findOne({ userId: new mongoose_1.Types.ObjectId(userId) });
            if (!cart) {
                throw new AppError_1.default('Cart not found', 404, 'CART_NOT_FOUND');
            }
            cart.items = [];
            yield cart.save();
            return yield this.enrichCart(yield this.getPopulatedCart(userId));
        });
    }
    /**
     * Get cart item count
     */
    getCartCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const cart = yield cart_model_1.Cart.findOne({ userId: new mongoose_1.Types.ObjectId(userId) });
            if (!cart) {
                return { count: 0, subtotal: 0 };
            }
            const count = cart.items.reduce((total, item) => total + item.quantity, 0);
            return {
                count,
                subtotal: cart.subtotal,
            };
        });
    }
}
exports.default = new CartService();
