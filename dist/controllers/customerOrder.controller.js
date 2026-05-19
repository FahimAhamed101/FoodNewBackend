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
const customerOrder_service_1 = __importDefault(require("../services/customerOrder.service"));
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = __importDefault(require("../utils/AppError"));
class CustomerOrderController {
    constructor() {
        this.getCurrentOrders = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const customerId = req.user.userId;
            const orders = yield customerOrder_service_1.default.getCurrentOrders(customerId);
            res.status(200).json({
                success: true,
                data: orders
            });
        }));
        this.getPreviousOrders = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const customerId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
                throw new AppError_1.default('Invalid pagination parameters', 400, 'INVALID_PAGINATION');
            }
            const { orders, total, page: currentPage, limit: currentLimit } = yield customerOrder_service_1.default.getPreviousOrders(customerId, page, limit);
            res.status(200).json({
                success: true,
                meta: {
                    total,
                    page: currentPage,
                    limit: currentLimit
                },
                data: orders
            });
        }));
    }
}
exports.default = new CustomerOrderController();
