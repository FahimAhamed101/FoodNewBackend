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
const state_model_1 = require("../models/state.model");
const AppError_1 = __importDefault(require("../utils/AppError"));
class AdminTaxService {
    /**
     * Get overall tax dashboard statistics
     */
    getTaxDashboard() {
        return __awaiter(this, void 0, void 0, function* () {
            const totalStates = yield state_model_1.State.countDocuments();
            const activeStates = yield state_model_1.State.countDocuments({ isActive: true, tax: { $gt: 0 } });
            const remainingStates = totalStates - activeStates;
            const stateRules = yield state_model_1.State.find({})
                .sort({ name: 1 })
                .select('name tax isActive updatedAt')
                .lean();
            return {
                "Tax information": {
                    "ToralStates": totalStates,
                    "Active": activeStates,
                    "RemainingStates": remainingStates
                },
                "StateTexRules": stateRules.map(s => ({
                    id: s._id,
                    state: s.name,
                    TaxRules: `${s.tax}%`,
                    Status: s.isActive ? 'Active' : 'Inactive',
                    LastUpdated: s.updatedAt
                }))
            };
        });
    }
    /**
     * Create or Update a tax rule for a state
     */
    updateTaxRule(stateId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const state = yield state_model_1.State.findByIdAndUpdate(stateId, {
                $set: Object.assign(Object.assign({}, (data.tax !== undefined && { tax: data.tax })), (data.isActive !== undefined && { isActive: data.isActive }))
            }, { new: true, runValidators: true });
            if (!state) {
                throw new AppError_1.default('State tax rule not found', 404);
            }
            return state;
        });
    }
    /**
     * Create a new state tax rule (if it doesn't exist)
     */
    createTaxRule(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const existing = yield state_model_1.State.findOne({ code: data.code.toUpperCase() });
            if (existing) {
                throw new AppError_1.default('Tax rule for this state already exists. Use update instead.', 400);
            }
            return yield state_model_1.State.create({
                name: data.name,
                code: data.code.toUpperCase(),
                tax: data.tax,
                isActive: (_a = data.isActive) !== null && _a !== void 0 ? _a : true,
                country: 'USA'
            });
        });
    }
    /**
     * Delete a tax rule (Soft or Hard? User said CRUD, usually Admin can delete)
     */
    deleteTaxRule(stateId) {
        return __awaiter(this, void 0, void 0, function* () {
            const state = yield state_model_1.State.findByIdAndDelete(stateId);
            if (!state) {
                throw new AppError_1.default('State tax rule not found', 404);
            }
            return { message: 'Tax rule deleted successfully' };
        });
    }
}
exports.default = new AdminTaxService();
