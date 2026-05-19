"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("stripe"));
const index_1 = __importDefault(require("./index"));
if (!index_1.default.stripe.secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}
const stripe = new stripe_1.default(index_1.default.stripe.secretKey, {
    apiVersion: '2026-01-28.clover',
    typescript: true,
});
exports.default = stripe;
