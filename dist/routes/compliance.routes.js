"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const user_model_1 = require("../models/user.model");
const compliance_controller_1 = __importDefault(require("../controllers/compliance.controller"));
const router = express_1.default.Router();
// Only Admins can manage compliance
router.use(authenticate_1.authenticate, (0, requireRole_1.requireRole)([user_model_1.UserRole.ADMIN]));
router.get('/violations', compliance_controller_1.default.getViolations);
router.patch('/violations/:id', compliance_controller_1.default.takeAction);
exports.default = router;
