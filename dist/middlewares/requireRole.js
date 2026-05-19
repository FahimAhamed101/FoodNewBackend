"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const AppError_1 = __importDefault(require("../utils/AppError"));
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError_1.default('You do not have permission to perform this action', 403, 'ROLE_ERROR'));
        }
        next();
    };
};
exports.requireRole = requireRole;
