"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rawBodyMiddleware = void 0;
/**
 * Middleware to capture raw body for Stripe webhook signature verification
 * This must be applied BEFORE express.json() middleware
 */
const rawBodyMiddleware = (req, res, next) => {
    if (req.originalUrl === '/api/v1/stripe/webhook') {
        let data = '';
        req.setEncoding('utf8');
        req.on('data', (chunk) => {
            data += chunk;
        });
        req.on('end', () => {
            req.body = data;
            next();
        });
    }
    else {
        next();
    }
};
exports.rawBodyMiddleware = rawBodyMiddleware;
