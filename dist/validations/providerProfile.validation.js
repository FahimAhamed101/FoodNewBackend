"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z.preprocess((arg) => {
        var _a, _b;
        const body = Object.assign({}, arg);
        // Normalize coordinate keys (lat, lng, location[lat], location[lng])
        const rawLat = (_a = body.lat) !== null && _a !== void 0 ? _a : body['location[lat]'];
        const rawLng = (_b = body.lng) !== null && _b !== void 0 ? _b : body['location[lng]'];
        if (rawLat !== undefined || rawLng !== undefined) {
            body.location = {};
            // Aggressive cleaning: Remove everything except digits, dots, and minus signs
            const clean = (val) => {
                if (typeof val !== 'string')
                    return val;
                const cleaned = val.trim().replace(/[^\d.-]/g, '');
                return cleaned === '' ? undefined : cleaned;
            };
            const processedLat = clean(rawLat);
            const processedLng = clean(rawLng);
            if (processedLat !== undefined)
                body.location.lat = processedLat;
            if (processedLng !== undefined)
                body.location.lng = processedLng;
        }
        // Clean up temporary flat keys
        delete body['location[lat]'];
        delete body['location[lng]'];
        delete body.lat;
        delete body.lng;
        if (Array.isArray(body.location))
            delete body.location;
        // Handle cuisine parsing
        if (typeof body.cuisine === 'string') {
            try {
                body.cuisine = JSON.parse(body.cuisine);
            }
            catch (_c) {
                const trimmed = body.cuisine.trim();
                body.cuisine = trimmed ? [trimmed] : [];
            }
        }
        return body;
    }, zod_1.z.object({
        profile: zod_1.z.string().url('Profile must be a valid URL').optional(),
        restaurantName: zod_1.z.string().trim().min(2).max(100).optional(),
        contactEmail: zod_1.z.string().email('Invalid email format').optional(),
        phoneNumber: zod_1.z.string().optional(),
        restaurantAddress: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        state: zod_1.z.string().optional(),
        zipCode: zod_1.z.string().optional(),
        location: zod_1.z.object({
            lat: zod_1.z.preprocess((val) => (val === undefined || val === '' ? undefined : Number(val)), zod_1.z.number().min(-90).max(90).optional()),
            lng: zod_1.z.preprocess((val) => (val === undefined || val === '' ? undefined : Number(val)), zod_1.z.number().min(-180).max(180).optional())
        }).optional(),
        cuisine: zod_1.z.array(zod_1.z.string()).optional(),
    })),
});
