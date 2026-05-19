"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPublicMediaUrl = exports.getRequestBaseUrl = void 0;
const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+\-.]*:\/\//i;
const readForwardedHeader = (value) => {
    var _a, _b, _c;
    if (Array.isArray(value)) {
        return ((_b = (_a = value[0]) === null || _a === void 0 ? void 0 : _a.split(',')[0]) === null || _b === void 0 ? void 0 : _b.trim()) || '';
    }
    return ((_c = value === null || value === void 0 ? void 0 : value.split(',')[0]) === null || _c === void 0 ? void 0 : _c.trim()) || '';
};
const normalizeCloudinaryUrl = (value) => value.replace(/^http:\/\/res\.cloudinary\.com\//i, 'https://res.cloudinary.com/');
const getRequestBaseUrl = (req) => {
    const forwardedProto = readForwardedHeader(req.headers['x-forwarded-proto']);
    const forwardedHost = readForwardedHeader(req.headers['x-forwarded-host']);
    const protocol = forwardedProto || req.protocol || 'http';
    const host = forwardedHost || req.get('host') || '';
    return host ? `${protocol}://${host}` : '';
};
exports.getRequestBaseUrl = getRequestBaseUrl;
const toPublicMediaUrl = (value, baseUrl = '') => {
    if (typeof value !== 'string')
        return '';
    const trimmed = value.trim();
    if (!trimmed)
        return '';
    if (trimmed.startsWith('data:')) {
        return trimmed;
    }
    if (trimmed.startsWith('//')) {
        return `https:${trimmed}`;
    }
    const normalized = trimmed.replace(/\\/g, '/');
    if (ABSOLUTE_URL_PATTERN.test(normalized)) {
        return normalizeCloudinaryUrl(normalized);
    }
    if (/^res\.cloudinary\.com\//i.test(normalized)) {
        return `https://${normalized}`;
    }
    if (/^\/?uploads\//i.test(normalized) && process.env.CLOUDINARY_CLOUD_NAME) {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME.trim();
        const publicId = normalized.replace(/^\/+/, '');
        return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
    }
    const pathname = normalized.startsWith('/') ? normalized : `/${normalized}`;
    return baseUrl ? `${baseUrl}${pathname}` : pathname;
};
exports.toPublicMediaUrl = toPublicMediaUrl;
