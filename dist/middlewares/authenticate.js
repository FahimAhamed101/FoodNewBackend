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
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const user_model_1 = require("../models/user.model");
const blacklistedToken_model_1 = require("../models/blacklistedToken.model");
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return next(new AppError_1.default('You are not logged in! Please log in to get access.', 401, 'AUTH_ERROR'));
        }
        const isBlacklisted = yield blacklistedToken_model_1.BlacklistedToken.findOne({ token });
        if (isBlacklisted) {
            return next(new AppError_1.default('This token is no longer valid. Please log in again.', 401, 'AUTH_ERROR'));
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'super-secret-key');
        const user = yield user_model_1.User.findById(decoded.userId);
        if (!user) {
            return next(new AppError_1.default('The user belonging to this token no longer exists.', 401, 'AUTH_ERROR'));
        }
        req.token = token;
        req.user = {
            userId: user._id.toString(),
            role: user.role,
        };
        next();
    }
    catch (err) {
        next(new AppError_1.default('Invalid token. Please log in again!', 401, 'AUTH_ERROR'));
    }
});
exports.authenticate = authenticate;
