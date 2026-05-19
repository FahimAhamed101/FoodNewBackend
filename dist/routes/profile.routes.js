"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const profile_controller_1 = __importDefault(require("../controllers/profile.controller"));
const authenticate_1 = require("../middlewares/authenticate");
const validate_1 = require("../middlewares/validate");
const upload_1 = require("../middlewares/upload");
const profile_validation_1 = require("../validations/profile.validation");
const router = express_1.default.Router();
const profileLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many profile requests, please try again later',
    },
});
router.use(authenticate_1.authenticate);
router.use(profileLimiter);
router.get(['/', '/me'], profile_controller_1.default.getProfile);
router.patch(['/', '/me'], upload_1.upload.single('profilePic'), (0, validate_1.validate)(profile_validation_1.updateProfileSchema), profile_controller_1.default.updateProfile);
router.put(['/', '/me'], upload_1.upload.single('profilePic'), (0, validate_1.validate)(profile_validation_1.updateProfileSchema), profile_controller_1.default.updateProfile);
router.delete(['/', '/me'], profile_controller_1.default.deleteProfile);
exports.default = router;
