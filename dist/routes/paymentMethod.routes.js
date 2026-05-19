"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticate_1 = require("../middlewares/authenticate");
const paymentMethod_controller_1 = __importDefault(require("../controllers/paymentMethod.controller"));
const requireRole_1 = require("../middlewares/requireRole");
const user_model_1 = require("../models/user.model");
const validate_1 = require("../middlewares/validate");
const paymentMethod_validation_1 = require("../validations/paymentMethod.validation");
const router = express_1.default.Router();
// All routes require authentication
router.use(authenticate_1.authenticate);
// Restricted to CUSTOMER only as per user request
router.use((0, requireRole_1.requireRole)([user_model_1.UserRole.CUSTOMER]));
router.get('/', paymentMethod_controller_1.default.getMethods);
router.post('/', (0, validate_1.validate)(paymentMethod_validation_1.addPaymentMethodSchema), paymentMethod_controller_1.default.addMethod);
router.patch('/:id/default', (0, validate_1.validate)(paymentMethod_validation_1.paymentMethodIdSchema), paymentMethod_controller_1.default.setDefault);
router.delete('/:id', (0, validate_1.validate)(paymentMethod_validation_1.paymentMethodIdSchema), paymentMethod_controller_1.default.deleteMethod);
exports.default = router;
