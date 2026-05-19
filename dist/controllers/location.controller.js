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
const location_service_1 = __importDefault(require("../services/location.service"));
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = __importDefault(require("../utils/AppError"));
class LocationController {
    constructor() {
        /**
         * GET /api/v1/location/city?lat=37.7749&lng=-122.4194
         *
         * Get city, state, country from latitude and longitude
         */
        this.getCityFromCoordinates = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { lat, lng } = req.query;
            // Validate query parameters
            if (!lat || !lng) {
                throw new AppError_1.default('Latitude and longitude are required', 400, 'MISSING_COORDINATES');
            }
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);
            // Validate coordinate values
            if (isNaN(latitude) || isNaN(longitude)) {
                throw new AppError_1.default('Invalid coordinates. Must be valid numbers', 400, 'INVALID_COORDINATES');
            }
            // Validate coordinate ranges
            location_service_1.default.validateCoordinates(latitude, longitude);
            // Get location data
            const locationData = yield location_service_1.default.getCityFromCoordinates(latitude, longitude);
            res.status(200).json({
                success: true,
                data: locationData,
            });
        }));
    }
}
exports.default = new LocationController();
