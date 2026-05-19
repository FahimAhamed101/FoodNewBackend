"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const state_controller_1 = __importDefault(require("../controllers/state.controller"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
const stateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    message: {
        success: false,
        message: 'Too many requests, please try again later'
    }
});
router.use(stateLimiter);
router.get('/', state_controller_1.default.getAllStates);
router.get('/search', state_controller_1.default.searchStates);
router.get('/tax', state_controller_1.default.getTaxByState);
exports.default = router;
