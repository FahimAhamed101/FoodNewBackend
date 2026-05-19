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
Object.defineProperty(exports, "__esModule", { value: true });
const state_model_1 = require("../models/state.model");
class StateService {
    /**
     * Get all active states (for dropdowns, etc.)
     */
    getAllStates() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield state_model_1.State.find({ isActive: true })
                .select('_id name code')
                .sort({ name: 1 })
                .lean();
        });
    }
    /**
     * Get state by ID
     */
    getStateById(stateId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield state_model_1.State.findOne({ _id: stateId, isActive: true }).lean();
        });
    }
    /**
     * Get state by code
     */
    getStateByCode(code) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield state_model_1.State.findOne({
                code: code.toUpperCase(),
                isActive: true,
            }).lean();
        });
    }
    /**
     * Search states by name (for autocomplete)
     */
    searchStates(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const regex = new RegExp(query, 'i');
            return yield state_model_1.State.find({
                name: { $regex: regex },
                isActive: true,
            })
                .select('_id name code')
                .limit(10)
                .lean();
        });
    }
    /**
     * Get tax rate by state name or code
     */
    getTaxByState(stateQuery) {
        return __awaiter(this, void 0, void 0, function* () {
            // Try to find by code first (exact match)
            let state = yield state_model_1.State.findOne({
                code: stateQuery.toUpperCase(),
                isActive: true,
            }).lean();
            // If not found by code, try by name (case-insensitive)
            if (!state) {
                state = yield state_model_1.State.findOne({
                    name: { $regex: new RegExp(`^${stateQuery}$`, 'i') },
                    isActive: true,
                }).lean();
            }
            return state;
        });
    }
}
exports.default = new StateService();
