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
const adminPaymentMethod_service_1 = __importDefault(require("../services/adminPaymentMethod.service"));
const AppError_1 = __importDefault(require("../utils/AppError"));
class AdminPaymentMethodController {
    constructor() {
        /**
         * GET /api/v1/admin/payment-methods
         */
        this.getAll = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search;
            const data = yield adminPaymentMethod_service_1.default.getAllPaymentMethods(page, limit, search);
            res.status(200).json({
                success: true,
                data
            });
        }));
        /**
         * POST /api/v1/admin/payment-methods
         */
        this.create = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { userId, cardholderName, brand, last4, expiryDate, isDefault } = req.body;
            if (!userId || !cardholderName || !last4 || !expiryDate) {
                throw new AppError_1.default('userId, cardholderName, last4, and expiryDate are required', 400);
            }
            const method = yield adminPaymentMethod_service_1.default.createPaymentMethod({
                userId,
                cardholderName,
                brand,
                last4,
                expiryDate,
                isDefault
            });
            res.status(201).json({
                success: true,
                message: 'Payment method created successfully',
                data: method
            });
        }));
        /**
         * PATCH /api/v1/admin/payment-methods/:id
         */
        this.update = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const method = yield adminPaymentMethod_service_1.default.updatePaymentMethod(id, req.body);
            res.status(200).json({
                success: true,
                message: 'Payment method updated successfully',
                data: method
            });
        }));
        /**
         * DELETE /api/v1/admin/payment-methods/:id
         */
        this.delete = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const result = yield adminPaymentMethod_service_1.default.deletePaymentMethod(id);
            res.status(200).json(Object.assign({ success: true }, result));
        }));
    }
}
exports.default = new AdminPaymentMethodController();
