"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const food_controller_1 = __importDefault(require("../controllers/food.controller"));
const favorite_controller_1 = __importDefault(require("../controllers/favorite.controller"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const requireApproval_1 = require("../middlewares/requireApproval");
const validate_1 = require("../middlewares/validate");
const upload_1 = require("../middlewares/upload");
const food_validation_1 = require("../validations/food.validation");
const router = express_1.default.Router();
const foodOpsLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many food management operations, please try again after 15 minutes',
    },
});
// Public Route
router.get('/search', food_controller_1.default.searchFoods);
router.use(authenticate_1.authenticate);
router.use((0, requireRole_1.requireRole)(['PROVIDER']));
router.use(requireApproval_1.requireApproval);
router.use(foodOpsLimiter);
// Create food - requires multipart/form-data image upload
router.post('/', upload_1.upload.single('image'), (0, validate_1.validate)(food_validation_1.createFoodSchema), food_controller_1.default.createFood);
// Get own foods
router.get('/', (0, validate_1.validate)(food_validation_1.getFoodsQuerySchema), food_controller_1.default.getOwnFoods);
// Get foods by category
router.get('/category/:categoryId', (0, validate_1.validate)(food_validation_1.foodByCategorySchema), food_controller_1.default.getFoodsByCategory);
// Get, update, delete food by ID
router.route('/:id')
    .get((0, validate_1.validate)(food_validation_1.foodIdSchema), food_controller_1.default.getFoodById)
    // Optional image replacement via multipart/form-data
    .patch(upload_1.upload.single('image'), (0, validate_1.validate)(food_validation_1.updateFoodSchema), food_controller_1.default.updateFood)
    .delete((0, validate_1.validate)(food_validation_1.foodIdSchema), food_controller_1.default.deleteFood);
router.get('/:foodId/stats', (0, requireRole_1.requireRole)(['PROVIDER']), favorite_controller_1.default.getFoodStats);
exports.default = router;
