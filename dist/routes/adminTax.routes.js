"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const adminTax_controller_1 = __importDefault(require("../controllers/adminTax.controller"));
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router();
// All routes require ADMIN role
router.use(authenticate_1.authenticate);
router.use((0, requireRole_1.requireRole)([user_model_1.UserRole.ADMIN]));
/**
 * @route GET /api/v1/admin/tax/dashboard
 * @desc Get tax statistics and list of rules
 */
router.get('/dashboard', adminTax_controller_1.default.getDashboard);
/**
 * @route POST /api/v1/admin/tax/rules
 * @desc Create new state tax rule
 */
router.post('/rules', adminTax_controller_1.default.createRule);
/**
 * @route PATCH /api/v1/admin/tax/rules/:id
 * @desc Update existing tax rule
 */
router.patch('/rules/:id', adminTax_controller_1.default.updateRule);
/**
 * @route DELETE /api/v1/admin/tax/rules/:id
 * @desc Delete a tax rule
 */
router.delete('/rules/:id', adminTax_controller_1.default.deleteRule);
exports.default = router;
