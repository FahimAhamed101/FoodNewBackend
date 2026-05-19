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
const cart_service_1 = __importDefault(require("../services/cart.service"));
const catchAsync_1 = require("../utils/catchAsync");
class CartController {
    constructor() {
        /**
         * GET /api/v1/cart
         * Get current user's cart
         */
        this.getCart = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const cart = yield cart_service_1.default.getCart(userId);
            res.status(200).json({
                success: true,
                data: cart,
            });
        }));
        /**
         * POST /api/v1/cart/add
         * Add item to cart
         */
        this.addToCart = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { foodId, quantity } = req.body;
            const cart = yield cart_service_1.default.addToCart(userId, foodId, quantity);
            res.status(200).json({
                success: true,
                message: 'Item added to cart',
                data: cart,
            });
        }));
        /**
         * PATCH /api/v1/cart/update
         * Update item quantity
         */
        this.updateCartItem = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { foodId, quantity } = req.body;
            const cart = yield cart_service_1.default.updateCartItem(userId, foodId, quantity);
            res.status(200).json({
                success: true,
                message: 'Cart updated',
                data: cart,
            });
        }));
        /**
         * DELETE /api/v1/cart/remove
         * Remove item from cart
         */
        this.removeFromCart = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { foodId } = req.body;
            const cart = yield cart_service_1.default.removeFromCart(userId, foodId);
            res.status(200).json({
                success: true,
                message: 'Item removed from cart',
                data: cart,
            });
        }));
        /**
         * DELETE /api/v1/cart/clear
         * Clear entire cart
         */
        this.clearCart = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const cart = yield cart_service_1.default.clearCart(userId);
            res.status(200).json({
                success: true,
                message: 'Cart cleared',
                data: cart,
            });
        }));
        /**
         * GET /api/v1/cart/count
         * Get cart item count (for badge)
         */
        this.getCartCount = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const data = yield cart_service_1.default.getCartCount(userId);
            res.status(200).json({
                success: true,
                data,
            });
        }));
    }
}
exports.default = new CartController();
