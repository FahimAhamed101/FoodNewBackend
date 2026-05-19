"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const category_controller_1 = __importDefault(require("../controllers/category.controller"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const requireApproval_1 = require("../middlewares/requireApproval");
const validate_1 = require("../middlewares/validate");
const category_validation_1 = require("../validations/category.validation");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const router = express_1.default.Router();
const providerLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many category operations, please try again after an hour',
    },
});
// --- Public Routes ---
router.get('/', category_controller_1.default.getAllCategories);
// --- Protected Routes (Provider Only) ---
router.use(authenticate_1.authenticate);
router.use((0, requireRole_1.requireRole)(['PROVIDER']));
router.use(requireApproval_1.requireApproval);
router.use(providerLimiter);
router.post('/', cloudinary_1.default.upload.single('image'), (0, validate_1.validate)(category_validation_1.createCategorySchema), category_controller_1.default.createCategory);
router.get('/my-categories', category_controller_1.default.getOwnCategories);
router.route('/:id')
    .get((0, validate_1.validate)(category_validation_1.categoryIdSchema), category_controller_1.default.getCategoryById)
    .patch(cloudinary_1.default.upload.single('image'), (0, validate_1.validate)(category_validation_1.updateCategorySchema), category_controller_1.default.updateCategory)
    .delete((0, validate_1.validate)(category_validation_1.categoryIdSchema), category_controller_1.default.deleteCategory);
exports.default = router;
