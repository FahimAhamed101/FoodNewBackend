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
Object.defineProperty(exports, "__esModule", { value: true });
const providerProfile_model_1 = require("../models/providerProfile.model");
/**
 * Provider Repository - Advanced queries for provider data
 */
class ProviderRepository {
    /**
     * Find nearby providers using MongoDB geospatial query
     * NOTE: Requires 2dsphere index on location field
     * Run: db.providerprofiles.createIndex({ location: "2dsphere" })
     */
    findNearbyWithGeospatial(coordinates_1, radiusKm_1) {
        return __awaiter(this, arguments, void 0, function* (coordinates, radiusKm, options = {}) {
            const { cuisine, limit = 20, skip = 0 } = options;
            const query = {
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [coordinates.lng, coordinates.lat] // [longitude, latitude]
                        },
                        $maxDistance: radiusKm * 1000 // Convert km to meters
                    }
                },
                isActive: true,
                status: 'ACTIVE',
                verificationStatus: 'APPROVED'
            };
            if (cuisine) {
                query.cuisine = { $in: [cuisine] };
            }
            return yield providerProfile_model_1.ProviderProfile.find(query)
                .select('providerId restaurantName location cuisine restaurantAddress city state phoneNumber contactEmail profile isVerify verificationStatus')
                .skip(skip)
                .limit(limit)
                .lean();
        });
    }
    /**
     * Find providers within a bounding box (alternative to radius search)
     */
    findWithinBounds(minLat, maxLat, minLng, maxLng) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield providerProfile_model_1.ProviderProfile.find({
                'location.lat': { $gte: minLat, $lte: maxLat },
                'location.lng': { $gte: minLng, $lte: maxLng },
                isActive: true,
                status: 'ACTIVE',
                verificationStatus: 'APPROVED'
            }).lean();
        });
    }
    /**
     * Get all active providers with valid locations
     */
    findAllWithLocation(cuisine) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                isActive: true,
                status: 'ACTIVE',
                verificationStatus: 'APPROVED',
                'location.lat': { $exists: true, $ne: null },
                'location.lng': { $exists: true, $ne: null }
            };
            if (cuisine) {
                query.cuisine = { $in: [cuisine] };
            }
            return yield providerProfile_model_1.ProviderProfile.find(query)
                .select('providerId restaurantName location cuisine restaurantAddress city state phoneNumber contactEmail profile isVerify verificationStatus')
                .lean();
        });
    }
}
exports.default = new ProviderRepository();
