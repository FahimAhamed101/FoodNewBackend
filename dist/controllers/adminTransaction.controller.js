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
const adminTransaction_service_1 = __importDefault(require("../services/adminTransaction.service"));
class AdminTransactionController {
    constructor() {
        /**
         * GET /admin/transactions-orders/
         * OR /admin/transactions-orders/:providerId
         *
         * Get transaction & order analytics (global or specific provider)
         */
        this.getTransactionsDashboard = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const providerId = req.params.providerId || req.query.providerId; // Check both
            const page = parseInt(String(req.query.page || '1'), 10);
            const limit = parseInt(String(req.query.limit || '20'), 10);
            const statusQuery = req.query.status;
            const status = typeof statusQuery === 'string' ? statusQuery : undefined;
            const timeRangeQuery = req.query.timeRange;
            const timeRange = typeof timeRangeQuery === 'string' ? timeRangeQuery : undefined;
            const startDateQuery = req.query.startDate;
            const startDate = typeof startDateQuery === 'string' ? startDateQuery : undefined;
            const endDateQuery = req.query.endDate;
            const endDate = typeof endDateQuery === 'string' ? endDateQuery : undefined;
            const result = yield adminTransaction_service_1.default.getTransactions(providerId, page, limit, status, timeRange, startDate, endDate);
            res.status(200).json({
                success: true,
                restaurantsid: result.restaurantsid,
                restaurantsName: result.restaurantsName,
                summary: result.summary,
                pagination: result.pagination,
                transactions: result.transactions
            });
        }));
    }
}
exports.default = new AdminTransactionController();
