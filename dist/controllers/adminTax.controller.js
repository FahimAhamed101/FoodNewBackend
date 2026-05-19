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
const adminTax_service_1 = __importDefault(require("../services/adminTax.service"));
class AdminTaxController {
    /**
     * Get the tax dashboard with stats and rules list
     */
    getDashboard(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dashboard = yield adminTax_service_1.default.getTaxDashboard();
                res.status(200).json({
                    success: true,
                    data: dashboard
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Create a new state tax rule
     */
    createRule(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const rule = yield adminTax_service_1.default.createTaxRule(req.body);
                res.status(201).json({
                    success: true,
                    message: 'Tax rule created successfully',
                    data: rule
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Update an existing tax rule
     */
    updateRule(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const rule = yield adminTax_service_1.default.updateTaxRule(req.params.id, req.body);
                res.status(200).json({
                    success: true,
                    message: 'Tax rule updated successfully',
                    data: rule
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Delete a tax rule
     */
    deleteRule(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield adminTax_service_1.default.deleteTaxRule(req.params.id);
                res.status(200).json({
                    success: true,
                    message: 'Tax rule deleted successfully'
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new AdminTaxController();
