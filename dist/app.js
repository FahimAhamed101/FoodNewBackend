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
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const activity_routes_1 = __importDefault(require("./routes/activity.routes"));
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
// Stripe webhook needs raw body - must be before express.json()
app.use('/api/v1/stripe/webhook', express_1.default.raw({ type: 'application/json' }));
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
app.use('/api/v1', providerOnboarding_routes_1.default); // routes internally use /auth/provider/* and /provider/onboarding/*
app.use('/api/v1/categories', category_routes_1.default);
app.use('/api/v1/foods', food_routes_1.default);
app.use('/api/v1/cart', cart_routes_1.default);
app.use('/api/v1/orders', order_routes_1.default);
app.use('/api/v1/customer/orders', customerOrder_routes_1.default);
app.use('/api/v1/reviews', review_routes_1.default);
app.use('/api/v1/admin/reviews', review_routes_1.default); // Alias for admin dashboard
app.use('/api/v1/favorites', favorite_routes_1.default);
app.use('/api/v1/feed', feed_routes_1.default);
app.use('/api/v1/top-rated', topRated_routes_1.default);
app.use('/api/v1/admin/top', topRated_routes_1.default); // Alias for admin dashboard
app.use('/api/v1/dashboard', dashboard_routes_1.default);
app.use('/api/v1/analytics', analytics_routes_1.default);
app.use('/api/v1/payments', payment_routes_1.default);
app.use('/api/v1/payment-methods', paymentMethod_routes_1.default);
app.use('/api/v1/stripe', stripe_routes_1.default);
app.use('/api/v1/locations', location_routes_1.default);
app.use('/api/v1/states', state_routes_1.default);
app.use('/api/v1/banners', banner_routes_1.default);
app.use('/api/v1/admin/banners', banner_routes_1.default); // Alias for admin dashboard
app.use('/api/v1/notifications', notification_routes_1.default);
app.use('/api/v1/support-tickets', supportTicket_routes_1.default);
app.use('/api/v1/support', supportTicket_routes_1.default); // Alternative route for frontend
app.use('/api/v1/compliance', compliance_routes_1.default);
app.use('/api/v1/oauth', oauth_routes_1.default);
app.use('/api/auth', oauth_routes_1.default); // Google OAuth legacy route
app.use('/api/v1/donation', mealToken_routes_1.default);
app.use('/api/v1/chat', chat_routes_1.default);
app.use('/api/v1/activities', activity_routes_1.default);
// Admin routes - specific routes FIRST, broad /admin mounts LAST
app.use('/api/v1/admin/analytics', adminAnalytics_routes_1.default);
app.use('/api/v1/admin/dashboard', adminAnalytics_routes_1.default); // analytics via dashboard prefix
app.use('/api/v1/admin/users', adminUser_routes_1.default);
app.use('/api/v1/admin/orders', adminOrder_routes_1.default);
app.use('/api/v1/admin/transactions', adminTransaction_routes_1.default);
app.use('/api/v1/admin/transactions-orders', adminTransaction_routes_1.default); // Alias for frontend compatibility
app.use('/api/v1/admin/customers', adminCustomer_routes_1.default);
app.use('/api/v1/admin/tax', adminTax_routes_1.default);
app.use('/api/v1/admin/payment-methods', adminPaymentMethod_routes_1.default);
app.use('/api/v1/admin/legal', adminLegalDocument_routes_1.default);
app.use('/api/v1/config', systemConfig_routes_1.default); // Public config routes: /logo, /public, /platform-fee
app.use('/api/v1/admin/config', systemConfig_routes_1.default);
app.use('/api/v1/admin/notifications', adminNotification_routes_1.default);
app.use('/api/v1/admin/donation', adminMealToken_routes_1.default);
app.use('/api/v1/admin/payouts', adminPayout_routes_1.default);
// Broad /api/v1/admin mounts MUST come LAST
app.use('/api/v1/admin', adminAnalytics_routes_1.default); // covers /top-restaurants, /trending-menus etc.
app.use('/api/v1/admin', adminDashboard_routes_1.default); // covers /feedback, /detailed-stats, /reviews
app.use('/api/v1/admin', adminRestaurant_routes_1.default); // covers /restaurants/:id, /dashboard/stats/:id
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
