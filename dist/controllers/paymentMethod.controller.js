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
const paymentMethod_service_1 = __importDefault(require("../services/paymentMethod.service"));
const catchAsync_1 = require("../utils/catchAsync");
class PaymentMethodController {
    constructor() {
        /**
         * GET /api/v1/payment-methods
         */
        this.getMethods = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.userId;
            const methods = yield paymentMethod_service_1.default.getPaymentMethods(userId);
            res.status(200).json({
                success: true,
                data: methods
            });
        }));
        /**
         * POST /api/v1/payment-methods
         */
        this.addMethod = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.userId;
            const method = yield paymentMethod_service_1.default.addPaymentMethod(userId, req.body);
            res.status(201).json({
                success: true,
                message: 'Payment method added successfully',
                data: method
            });
        }));
        /**
         * PATCH /api/v1/payment-methods/:id/default
         */
        this.setDefault = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.userId;
            const method = yield paymentMethod_service_1.default.setDefault(userId, req.params.id);
            res.status(200).json({
                success: true,
                message: 'Default payment method updated',
                data: method
            });
        }));
        /**
         * DELETE /api/v1/payment-methods/:id
         */
        this.deleteMethod = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user.userId;
            const result = yield paymentMethod_service_1.default.deletePaymentMethod(userId, req.params.id);
            res.status(200).json(Object.assign({ success: true }, result));
        }));
    }
}
exports.default = new PaymentMethodController();
