"use strict";
/**
 * Distance calculation utilities using Haversine formula
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistance = calculateDistance;
exports.filterByRadius = filterByRadius;
exports.isValidCoordinates = isValidCoordinates;
/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinate (latitude, longitude)
 * @param coord2 Second coordinate (latitude, longitude)
 * @returns Distance in kilometers
 */
function calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in kilometers
    const lat1Rad = toRadians(coord1.lat);
    const lat2Rad = toRadians(coord2.lat);
    const deltaLat = toRadians(coord2.lat - coord1.lat);
    const deltaLng = toRadians(coord2.lng - coord1.lng);
    // Haversine formula
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
}
/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
/**
 * Filter locations by radius
 * @param userLocation User's current location
 * @param locations Array of locations with coordinates
 * @param radiusKm Maximum distance in kilometers
 * @returns Filtered locations with distance property
 */
function filterByRadius(userLocation, locations, radiusKm) {
    return locations
        .map(location => (Object.assign(Object.assign({}, location), { distance: calculateDistance(userLocation, location.location) })))
        .filter(location => location.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance); // Sort by nearest first
}
/**
 * Validate coordinates
 */
function isValidCoordinates(lat, lng) {
    return (typeof lat === 'number' &&
        typeof lng === 'number' &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180);
}
