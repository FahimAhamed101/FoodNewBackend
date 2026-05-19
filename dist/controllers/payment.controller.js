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
const payment_service_1 = __importDefault(require("../services/payment.service"));
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = __importDefault(require("../utils/AppError"));
class PaymentController {
    constructor() {
        /**
         * GET /provider/payments/overview
         */
        this.getOverview = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const overview = yield payment_service_1.default.getOverview(providerId);
            res.status(200).json({
                success: true,
                data: overview
            });
        }));
        this.getHistory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            if (page < 1 || limit < 1) {
                throw new AppError_1.default('Invalid pagination parameters', 400, 'INVALID_PAGINATION');
            }
            const history = yield payment_service_1.default.getPaymentHistory(providerId, page, limit);
            res.status(200).json({
                success: true,
                data: history
            });
        }));
        this.search = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.user.userId;
            const query = req.query.query;
            if (!query) {
                throw new AppError_1.default('Search query is required', 400, 'INVALID_SEARCH_QUERY');
            }
            const results = yield payment_service_1.default.searchPayments(providerId, query);
            res.status(200).json({
                success: true,
                data: results
            });
        }));
    }
}
exports.default = new PaymentController();
