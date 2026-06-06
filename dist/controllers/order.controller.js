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
const order_service_1 = __importDefault(require("../services/order.service"));
const catchAsync_1 = require("../utils/catchAsync");
const order_model_1 = require("../models/order.model");
class OrderController {
    constructor() {
        this.createOrder = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const customerId = req.user.userId;
            const order = yield order_service_1.default.createOrder(customerId, req.body);
            res.status(201).json({
                success: true,
                message: 'Order placed successfully',
                data: order,
            });
        }));
        this.acceptOrder = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const { orderId } = req.params;
            const order = yield order_service_1.default.updateStatus(orderId, providerId, order_model_1.OrderStatus.PREPARING);
            res.status(200).json({
                success: true,
                message: 'Order accepted',
                data: order,
            });
        }));
        this.markReady = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const { orderId } = req.params;
            const order = yield order_service_1.default.updateStatus(orderId, providerId, order_model_1.OrderStatus.READY_FOR_PICKUP);
            res.status(200).json({
                success: true,
                message: 'Order marked as ready for pickup',
                data: order,
            });
        }));
        this.markPickedUp = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const { orderId } = req.params;
            const order = yield order_service_1.default.updateStatus(orderId, providerId, order_model_1.OrderStatus.PICKED_UP);
            res.status(200).json({
                success: true,
                message: 'Order marked as picked up',
                data: order,
            });
        }));
        this.markCompleted = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const { orderId } = req.params;
            const order = yield order_service_1.default.updateStatus(orderId, providerId, order_model_1.OrderStatus.COMPLETED);
            res.status(200).json({
                success: true,
                message: 'Order marked as completed',
                data: order,
            });
        }));
        this.notifyReadyForPickup = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const { orderId } = req.params;
            yield order_service_1.default.sendProviderNotification(orderId, providerId, order_model_1.OrderStatus.READY_FOR_PICKUP);
            res.status(200).json({
                success: true,
                message: 'Pickup notification sent',
            });
        }));
        this.notifyCompleted = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const { orderId } = req.params;
            yield order_service_1.default.sendProviderNotification(orderId, providerId, order_model_1.OrderStatus.COMPLETED);
            res.status(200).json({
                success: true,
                message: 'Completed notification sent',
            });
        }));
        this.cancelOrder = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.userId;
            const role = req.user.role; // Assumes role is populated in req.user
            const { orderId } = req.params;
            const { reason } = req.body;
            const order = yield order_service_1.default.cancelOrder(orderId, userId, role, reason);
            res.status(200).json({
                success: true,
                message: 'Order cancelled',
                data: order,
            });
        }));
        this.getAllOrders = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const data = yield order_service_1.default.getProviderOrders(providerId, Object.assign({ page, limit }, req.query));
            res.status(200).json({
                success: true,
                results: data.orders.length,
                pagination: data.pagination,
                data: data.orders,
            });
        }));
        this.getPendingOrders = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const data = yield order_service_1.default.getProviderOrders(providerId, { status: order_model_1.OrderStatus.PENDING, page, limit });
            res.status(200).json({
                success: true,
                results: data.orders.length,
                pagination: data.pagination,
                data: data.orders,
            });
        }));
        this.getPreparingOrders = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const data = yield order_service_1.default.getProviderOrders(providerId, { status: order_model_1.OrderStatus.PREPARING, page, limit });
            res.status(200).json({
                success: true,
                results: data.orders.length,
                pagination: data.pagination,
                data: data.orders,
            });
        }));
        this.getReadyOrders = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const data = yield order_service_1.default.getProviderOrders(providerId, { status: order_model_1.OrderStatus.READY_FOR_PICKUP, page, limit });
            res.status(200).json({
                success: true,
                results: data.orders.length,
                pagination: data.pagination,
                data: data.orders,
            });
        }));
        this.getPickedUpOrders = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const data = yield order_service_1.default.getProviderOrders(providerId, { status: order_model_1.OrderStatus.PICKED_UP, page, limit });
            res.status(200).json({
                success: true,
                results: data.orders.length,
                pagination: data.pagination,
                data: data.orders,
            });
        }));
        this.getCompletedOrders = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const data = yield order_service_1.default.getProviderOrders(providerId, { status: order_model_1.OrderStatus.COMPLETED, page, limit });
            res.status(200).json({
                success: true,
                results: data.orders.length,
                pagination: data.pagination,
                data: data.orders,
            });
        }));
        this.getCancelledOrders = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const data = yield order_service_1.default.getProviderOrders(providerId, { status: order_model_1.OrderStatus.CANCELLED, page, limit });
            res.status(200).json({
                success: true,
                results: data.orders.length,
                pagination: data.pagination,
                data: data.orders,
            });
        }));
        this.getOrderDetails = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.userId;
            const role = req.user.role;
            const { orderId } = req.params;
            const order = yield order_service_1.default.getOrderById(orderId, userId, role);
            res.status(200).json({
                success: true,
                data: order,
            });
        }));
        this.getUserOrders = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.userId;
            const role = req.user.role;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = Object.assign({ page, limit }, req.query);
            if (role === 'CUSTOMER') {
                filters.customerId = userId;
            }
            else {
                filters.providerId = userId;
            }
            const data = yield order_service_1.default.getOrders(filters);
            res.status(200).json({
                success: true,
                results: data.orders.length,
                pagination: data.pagination,
                data: data.orders,
            });
        }));
    }
}
exports.default = new OrderController();
