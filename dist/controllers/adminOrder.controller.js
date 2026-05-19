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
const AppError_1 = __importDefault(require("../utils/AppError"));
const adminOrder_service_1 = __importDefault(require("../services/adminOrder.service"));
class AdminOrderController {
    constructor() {
        /**
         * GET /admin/orders/:orderId
         * GET /admin/orders/:providerId/:orderId
         */
        this.getOrderDetails = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            let providerId = null;
            let orderId;
            if (req.params.orderId) {
                // Route: /:providerId/:orderId
                providerId = req.params.providerId;
                orderId = req.params.orderId;
            }
            else {
                // Route: /:orderId (orderId comes as first param)
                orderId = req.params.providerId; // first param is actually orderId
            }
            if (!orderId) {
                throw new AppError_1.default('Order ID is required', 400);
            }
            const orderDetails = yield adminOrder_service_1.default.getOrderDetails(providerId, orderId);
            res.status(200).json({
                success: true,
                order: orderDetails
            });
        }));
    }
}
exports.default = new AdminOrderController();
