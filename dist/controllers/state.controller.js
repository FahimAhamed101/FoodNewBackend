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
const state_service_1 = __importDefault(require("../services/state.service"));
const catchAsync_1 = require("../utils/catchAsync");
class StateController {
    constructor() {
        this.getAllStates = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const states = yield state_service_1.default.getAllStates();
            res.status(200).json({
                success: true,
                count: states.length,
                data: states,
            });
        }));
        this.searchStates = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const query = req.query.q;
            if (!query || query.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query must be at least 2 characters',
                });
            }
            const states = yield state_service_1.default.searchStates(query);
            res.status(200).json({
                success: true,
                count: states.length,
                data: states,
            });
        }));
        /**
         * GET /api/v1/states/tax?state=CA
         * Get tax rate by state name or code
         */
        this.getTaxByState = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const stateQuery = req.query.state;
            if (!stateQuery) {
                return res.status(400).json({
                    success: false,
                    message: 'State parameter is required',
                });
            }
            const state = yield state_service_1.default.getTaxByState(stateQuery);
            if (!state) {
                return res.status(404).json({
                    success: false,
                    message: 'State not found',
                });
            }
            res.status(200).json({
                success: true,
                data: {
                    name: state.name,
                    code: state.code,
                    tax: state.tax || 0,
                    country: state.country,
                },
            });
        }));
    }
}
exports.default = new StateController();
