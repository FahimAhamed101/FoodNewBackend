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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const config_1 = __importDefault(require("./config"));
const errorMiddleware_1 = __importDefault(require("./middlewares/errorMiddleware"));
const emailService_1 = require("./utils/emailService");
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
const getSupportEmail = () => {
    var _a;
    return process.env.SUPPORT_EMAIL ||
        process.env.RESEND_FROM_EMAIL ||
        ((_a = config_1.default.email) === null || _a === void 0 ? void 0 : _a.fromEmail) ||
        'support@dinefive.app';
};
const escapeHtml = (value) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
const getDeleteAccountPage = (supportEmail, statusMessage = '') => `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Delete Your DineFive Account</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f7f7f4;
      --text: #1f2933;
      --muted: #5f6b7a;
      --card: #ffffff;
      --border: #d9dee5;
      --accent: #f5b700;
      --accent-dark: #9a6b00;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.55;
    }
    main {
      max-width: 760px;
      margin: 0 auto;
      padding: 32px 18px 56px;
    }
    .panel {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 28px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
    }
    h1 {
      margin: 0 0 10px;
      font-size: clamp(28px, 5vw, 40px);
      line-height: 1.1;
    }
    h2 {
      margin: 28px 0 10px;
      font-size: 20px;
    }
    p, li { color: var(--muted); }
    ul, ol { padding-left: 22px; }
    label {
      display: block;
      margin: 16px 0 6px;
      font-weight: 700;
    }
    input, textarea {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 12px 14px;
      font: inherit;
      color: var(--text);
      background: #fff;
    }
    textarea { min-height: 92px; resize: vertical; }
    button {
      margin-top: 18px;
      width: 100%;
      border: 0;
      border-radius: 6px;
      padding: 14px 18px;
      background: var(--accent);
      color: #171717;
      font-weight: 800;
      cursor: pointer;
    }
    .notice {
      margin: 18px 0;
      padding: 12px 14px;
      border-left: 4px solid var(--accent);
      background: #fff8df;
      color: var(--accent-dark);
    }
    .meta {
      margin-top: 22px;
      font-size: 14px;
      color: var(--muted);
    }
    a { color: #0f6cbd; }
  </style>
</head>
<body>
  <main>
    <section class="panel">
      <h1>Delete Your DineFive Account</h1>
      <p>
        This public page explains how DineFive users can delete their account and request deletion
        from any browser.
      </p>

      ${statusMessage ? `<div class="notice">${escapeHtml(statusMessage)}</div>` : ''}

      <h2>Delete from the app</h2>
      <ol>
        <li>Open the DineFive app.</li>
        <li>Sign in to the account you want to delete.</li>
        <li>Go to Profile or Settings.</li>
        <li>Select Delete Account and confirm the deletion.</li>
      </ol>

      <h2>Request deletion here</h2>
      <p>
        If you cannot access the app, submit this form. Our support team will verify account
        ownership before deleting the account.
      </p>
      <form method="post" action="/delete-account">
        <label for="email">Account email address</label>
        <input id="email" name="email" type="email" required autocomplete="email" />

        <label for="details">Additional details, optional</label>
        <textarea id="details" name="details" maxlength="1000" placeholder="For example: I cannot log in to my account."></textarea>

        <button type="submit">Submit Deletion Request</button>
      </form>

      <h2>What data is deleted</h2>
      <ul>
        <li>Profile information, contact details, saved payment methods, favorites, cart data, notifications, OTPs, and active sessions.</li>
        <li>Account identifiers are anonymized or deactivated so the account can no longer be used.</li>
      </ul>

      <h2>Data we may retain</h2>
      <p>
        Some transaction, order, payment, tax, fraud-prevention, dispute, and legal records may be
        retained where required by law or legitimate business obligations. These records are not used
        for active account access.
      </p>

      <h2>Deletion timeline</h2>
      <p>
        In-app deletion starts immediately. Manual deletion requests are reviewed and completed
        within 30 days after ownership verification.
      </p>

      <p class="meta">
        Need help? Email <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a>.
      </p>
    </section>
  </main>
</body>
</html>`;
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
app.get('/delete-account', (_req, res) => {
    res.type('html').send(getDeleteAccountPage(getSupportEmail()));
});
app.post('/delete-account', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const supportEmail = getSupportEmail();
        const email = String(req.body.email || '').trim().toLowerCase();
        const details = String(req.body.details || '').trim();
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            res.status(400).type('html').send(getDeleteAccountPage(supportEmail, 'Please enter a valid account email address.'));
            return;
        }
        yield (0, emailService_1.sendEmail)({
            email: supportEmail,
            subject: `DineFive account deletion request: ${email}`,
            message: [
                'A user submitted an account deletion request from the public deletion page.',
                '',
                `Account email: ${email}`,
                `Details: ${details || 'No additional details provided.'}`,
                '',
                'Verify account ownership before deleting the account.',
            ].join('\n'),
        });
        res.type('html').send(getDeleteAccountPage(supportEmail, 'Your deletion request was submitted. We will verify ownership and complete eligible deletion requests within 30 days.'));
    }
    catch (error) {
        next(error);
    }
}));
app.get('/api/v1/auth/delete-account', (_req, res) => {
    res.redirect(302, '/delete-account');
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
