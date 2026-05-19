"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const config_1 = __importDefault(require("./config"));
const errorMiddleware_1 = __importDefault(require("./middlewares/errorMiddleware"));
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const provider_routes_1 = __importDefault(require("./routes/provider.routes"));
const providerOnboarding_routes_1 = __importDefault(require("./routes/providerOnboarding.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const food_routes_1 = __importDefault(require("./routes/food.routes"));
const cart_routes_1 = __importDefault(require("./routes/cart.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const customerOrder_routes_1 = __importDefault(require("./routes/customerOrder.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const favorite_routes_1 = __importDefault(require("./routes/favorite.routes"));
const feed_routes_1 = __importDefault(require("./routes/feed.routes"));
const topRated_routes_1 = __importDefault(require("./routes/topRated.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const paymentMethod_routes_1 = __importDefault(require("./routes/paymentMethod.routes"));
const stripe_routes_1 = __importDefault(require("./routes/stripe.routes"));
const location_routes_1 = __importDefault(require("./routes/location.routes"));
const state_routes_1 = __importDefault(require("./routes/state.routes"));
const banner_routes_1 = __importDefault(require("./routes/banner.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const supportTicket_routes_1 = __importDefault(require("./routes/supportTicket.routes"));
const compliance_routes_1 = __importDefault(require("./routes/compliance.routes"));
const oauth_routes_1 = __importDefault(require("./routes/oauth.routes"));
const mealToken_routes_1 = __importDefault(require("./routes/mealToken.routes"));
// Admin routes
const adminDashboard_routes_1 = __importDefault(require("./routes/adminDashboard.routes"));
const adminUser_routes_1 = __importDefault(require("./routes/adminUser.routes"));
const adminRestaurant_routes_1 = __importDefault(require("./routes/adminRestaurant.routes"));
const adminOrder_routes_1 = __importDefault(require("./routes/adminOrder.routes"));
const adminAnalytics_routes_1 = __importDefault(require("./routes/adminAnalytics.routes"));
const adminTransaction_routes_1 = __importDefault(require("./routes/adminTransaction.routes"));
const adminCustomer_routes_1 = __importDefault(require("./routes/adminCustomer.routes"));
const adminTax_routes_1 = __importDefault(require("./routes/adminTax.routes"));
const adminPaymentMethod_routes_1 = __importDefault(require("./routes/adminPaymentMethod.routes"));
const adminLegalDocument_routes_1 = __importDefault(require("./routes/adminLegalDocument.routes"));
const adminNotification_routes_1 = __importDefault(require("./routes/adminNotification.routes"));
const adminMealToken_routes_1 = __importDefault(require("./routes/adminMealToken.routes"));
const adminPayout_routes_1 = __importDefault(require("./routes/adminPayout.routes"));
const systemConfig_routes_1 = __importDefault(require("./routes/systemConfig.routes"));
const app = (0, express_1.default)();
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Body parser middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Logging middleware
if (config_1.default.env === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: config_1.default.env
    });
});
// API routes
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/profile', profile_routes_1.default);
app.use('/api/v1/provider', provider_routes_1.default);
app.use('/api/v1/provider-onboarding', providerOnboarding_routes_1.default);
app.use('/api/v1/categories', category_routes_1.default);
app.use('/api/v1/foods', food_routes_1.default);
app.use('/api/v1/cart', cart_routes_1.default);
app.use('/api/v1/orders', order_routes_1.default);
app.use('/api/v1/customer/orders', customerOrder_routes_1.default);
app.use('/api/v1/reviews', review_routes_1.default);
app.use('/api/v1/favorites', favorite_routes_1.default);
app.use('/api/v1/feed', feed_routes_1.default);
app.use('/api/v1/top-rated', topRated_routes_1.default);
app.use('/api/v1/dashboard', dashboard_routes_1.default);
app.use('/api/v1/analytics', analytics_routes_1.default);
app.use('/api/v1/payments', payment_routes_1.default);
app.use('/api/v1/payment-methods', paymentMethod_routes_1.default);
app.use('/api/v1/stripe', stripe_routes_1.default);
app.use('/api/v1/locations', location_routes_1.default);
app.use('/api/v1/states', state_routes_1.default);
app.use('/api/v1/banners', banner_routes_1.default);
app.use('/api/v1/notifications', notification_routes_1.default);
app.use('/api/v1/support-tickets', supportTicket_routes_1.default);
app.use('/api/v1/compliance', compliance_routes_1.default);
app.use('/api/v1/oauth', oauth_routes_1.default);
app.use('/api/v1/donation', mealToken_routes_1.default);
// Admin routes
app.use('/api/v1/admin/dashboard', adminDashboard_routes_1.default);
app.use('/api/v1/admin/users', adminUser_routes_1.default);
app.use('/api/v1/admin/restaurants', adminRestaurant_routes_1.default);
app.use('/api/v1/admin/orders', adminOrder_routes_1.default);
app.use('/api/v1/admin/analytics', adminAnalytics_routes_1.default);
app.use('/api/v1/admin/transactions', adminTransaction_routes_1.default);
app.use('/api/v1/admin/customers', adminCustomer_routes_1.default);
app.use('/api/v1/admin/tax', adminTax_routes_1.default);
app.use('/api/v1/admin/payment-methods', adminPaymentMethod_routes_1.default);
app.use('/api/v1/admin/legal-documents', adminLegalDocument_routes_1.default);
app.use('/api/v1/admin/config', systemConfig_routes_1.default);
app.use('/api/v1/admin/notifications', adminNotification_routes_1.default);
app.use('/api/v1/admin/donation', adminMealToken_routes_1.default);
app.use('/api/v1/admin/payouts', adminPayout_routes_1.default);
// 404 handler - catch all unmatched routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        errorCode: 'ROUTE_NOT_FOUND'
    });
});
// Global error handler
app.use(errorMiddleware_1.default);
exports.default = app;
