"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const topRated_controller_1 = __importDefault(require("../controllers/topRated.controller"));
const validate_1 = require("../middlewares/validate");
const topRated_validation_1 = require("../validations/topRated.validation");
const router = express_1.default.Router();
// Get top rated restaurants
router.get('/restaurants', (0, validate_1.validate)(topRated_validation_1.getTopRestaurantsSchema), topRated_controller_1.default.getTopRestaurants);
// Get top rated foods
router.get('/foods', (0, validate_1.validate)(topRated_validation_1.getTopFoodsSchema), topRated_controller_1.default.getTopFoods);
exports.default = router;
