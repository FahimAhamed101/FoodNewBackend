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
const axios_1 = __importDefault(require("axios"));
const AppError_1 = __importDefault(require("../utils/AppError"));
class LocationService {
    constructor() {
        this.NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
    }
    /**
     * Get city, state, country from latitude and longitude
     * Uses OpenStreetMap Nominatim API (free, no API key required)
     */
    getCityFromCoordinates(lat, lng) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield axios_1.default.get(this.NOMINATIM_URL, {
                    params: {
                        lat,
                        lon: lng,
                        format: 'json',
                        addressdetails: 1,
                    },
                    headers: {
                        'User-Agent': 'EMDR-Food-Delivery-App/1.0', // Required by Nominatim
                    },
                    timeout: 5000, // 5 second timeout
                });
                const address = response.data.address;
                if (!address) {
                    throw new AppError_1.default('Unable to determine location from coordinates', 404, 'LOCATION_NOT_FOUND');
                }
                // Extract city (can be city, town, village, or municipality)
                const city = address.city ||
                    address.town ||
                    address.village ||
                    address.municipality ||
                    address.county ||
                    'Unknown';
                // Extract state (can be state, province, or region)
                const state = address.state ||
                    address.province ||
                    address.region ||
                    'Unknown';
                // Extract country
                const country = address.country || 'Unknown';
                // Extract additional info
                const county = address.county || undefined;
                const zipCode = address.postcode || undefined;
                return {
                    city,
                    state,
                    country,
                    county,
                    zipCode,
                };
            }
            catch (error) {
                if (error instanceof AppError_1.default) {
                    throw error;
                }
                if (error.code === 'ECONNABORTED') {
                    throw new AppError_1.default('Location service timeout', 504, 'LOCATION_TIMEOUT');
                }
                if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 429) {
                    throw new AppError_1.default('Too many location requests. Please try again later', 429, 'RATE_LIMIT');
                }
                throw new AppError_1.default('Failed to get location from coordinates', 500, 'LOCATION_SERVICE_ERROR');
            }
        });
    }
    /**
     * Validate coordinates
     */
    validateCoordinates(lat, lng) {
        if (lat < -90 || lat > 90) {
            throw new AppError_1.default('Invalid latitude. Must be between -90 and 90', 400, 'INVALID_LATITUDE');
        }
        if (lng < -180 || lng > 180) {
            throw new AppError_1.default('Invalid longitude. Must be between -180 and 180', 400, 'INVALID_LONGITUDE');
        }
    }
}
exports.default = new LocationService();
