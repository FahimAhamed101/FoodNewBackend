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
const compliance_service_1 = __importDefault(require("../services/compliance.service"));
const catchAsync_1 = require("../utils/catchAsync");
class ComplianceController {
    constructor() {
        /**
         * Admin: Get all violations
         */
        this.getViolations = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const data = yield compliance_service_1.default.getAdminViolations(req.query);
            res.status(200).json({
                success: true,
                data
            });
        }));
        /**
         * Admin: Action (Warn/Remove)
         */
        this.takeAction = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { action } = req.body;
            const result = yield compliance_service_1.default.handleViolationAction(req.params.id, action);
            res.status(200).json({
                success: true,
                message: `Violation action '${action}' applied successfully`,
                data: result
            });
        }));
    }
}
exports.default = new ComplianceController();
