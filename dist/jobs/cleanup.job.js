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
exports.initJobs = void 0;
const customerOrder_service_1 = __importDefault(require("../services/customerOrder.service"));
const initJobs = () => {
    console.log('[JOBS] Initializing background jobs...');
    const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            console.log('[JOBS] Running scheduled order cleanup...');
            yield customerOrder_service_1.default.cleanupOldOrders();
        }
        catch (error) {
            console.error('[JOBS] Error during order cleanup:', error);
        }
    }), CLEANUP_INTERVAL);
    customerOrder_service_1.default.cleanupOldOrders().catch(err => {
        console.error('[JOBS] Initial cleanup failed:', err);
    });
};
exports.initJobs = initJobs;
