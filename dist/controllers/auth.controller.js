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
const auth_service_1 = __importDefault(require("../services/auth.service"));
const catchAsync_1 = require("../utils/catchAsync");
class AuthController {
    constructor() {
        this.signup = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield auth_service_1.default.signup(req.body);
            res.status(201).json({
                success: true,
                data: result,
            });
        }));
        this.providerSignup = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield auth_service_1.default.providerSignup(req.body);
            res.status(201).json({
                success: true,
                data: result,
            });
        }));
        this.verifyEmail = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email, otp } = req.body;
            const result = yield auth_service_1.default.verifyEmail(email, otp);
            res.status(200).json({
                success: true,
                data: result,
            });
        }));
        this.resendVerification = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            const result = yield auth_service_1.default.resendVerification(email);
            res.status(200).json({
                success: true,
                data: result,
            });
        }));
        this.login = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email, password } = req.body;
            const result = yield auth_service_1.default.login(email, password);
            res.status(200).json({
                success: true,
                data: result,
            });
        }));
        this.logout = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const token = req.token;
            if (!token) {
                throw new Error('Already logged out or no token provided');
            }
            const result = yield auth_service_1.default.logout(token);
            res.status(200).json({
                success: true,
                data: result,
            });
        }));
        this.forgotPassword = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            const result = yield auth_service_1.default.forgotPassword(email);
            res.status(200).json({
                success: true,
                data: result,
            });
        }));
        this.verifyForgotOtp = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email, otp } = req.body;
            const result = yield auth_service_1.default.verifyForgotOtp(email, otp);
            res.status(200).json({
                success: true,
                data: result,
            });
        }));
        this.resetPassword = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { newPassword } = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                throw new Error('Authentication required');
            }
            const result = yield auth_service_1.default.resetPassword(userId, newPassword);
            res.status(200).json({
                success: true,
                data: result,
            });
        }));
        this.changePassword = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                throw new Error('Authentication required');
            }
            const result = yield auth_service_1.default.changePassword(userId, req.body);
            res.status(200).json(Object.assign({ success: true }, result));
        }));
        this.deleteAccount = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                throw new Error('Authentication required');
            }
            const result = yield auth_service_1.default.deleteAccount(userId, req.token);
            res.status(200).json({
                success: true,
                data: result,
            });
        }));
    }
}
exports.default = new AuthController();
