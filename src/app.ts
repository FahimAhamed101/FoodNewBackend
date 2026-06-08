import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import config from './config';
import errorMiddleware from './middlewares/errorMiddleware';
import { sendEmail } from './utils/emailService';

// Import routes
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import providerRoutes from './routes/provider.routes';
import providerOnboardingRoutes from './routes/providerOnboarding.routes';
import categoryRoutes from './routes/category.routes';
import foodRoutes from './routes/food.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import customerOrderRoutes from './routes/customerOrder.routes';
import reviewRoutes from './routes/review.routes';
import favoriteRoutes from './routes/favorite.routes';
import feedRoutes from './routes/feed.routes';
import topRatedRoutes from './routes/topRated.routes';
import dashboardRoutes from './routes/dashboard.routes';
import analyticsRoutes from './routes/analytics.routes';
import paymentRoutes from './routes/payment.routes';
import paymentMethodRoutes from './routes/paymentMethod.routes';
import stripeRoutes from './routes/stripe.routes';
import locationRoutes from './routes/location.routes';
import stateRoutes from './routes/state.routes';
import bannerRoutes from './routes/banner.routes';
import notificationRoutes from './routes/notification.routes';
import supportTicketRoutes from './routes/supportTicket.routes';
import complianceRoutes from './routes/compliance.routes';
import oauthRoutes from './routes/oauth.routes';
import mealTokenRoutes from './routes/mealToken.routes';
import chatRoutes from './routes/chat.routes';
import activityRoutes from './routes/activity.routes';

// Admin routes
import adminDashboardRoutes from './routes/adminDashboard.routes';
import adminUserRoutes from './routes/adminUser.routes';
import adminRestaurantRoutes from './routes/adminRestaurant.routes';
import adminOrderRoutes from './routes/adminOrder.routes';
import adminAnalyticsRoutes from './routes/adminAnalytics.routes';
import adminTransactionRoutes from './routes/adminTransaction.routes';
import adminCustomerRoutes from './routes/adminCustomer.routes';
import adminTaxRoutes from './routes/adminTax.routes';
import adminPaymentMethodRoutes from './routes/adminPaymentMethod.routes';
import adminLegalDocumentRoutes from './routes/adminLegalDocument.routes';
import adminNotificationRoutes from './routes/adminNotification.routes';
import adminMealTokenRoutes from './routes/adminMealToken.routes';
import adminPayoutRoutes from './routes/adminPayout.routes';
import systemConfigRoutes from './routes/systemConfig.routes';

const app: Application = express();

const getSupportEmail = () =>
    process.env.SUPPORT_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    config.email?.fromEmail ||
    'support@dinefive.app';

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const getDeleteAccountPage = (supportEmail: string, statusMessage = '') => `
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
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Stripe webhook needs raw body - must be before express.json()
app.use('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (config.env === 'development') {
    app.use(morgan('dev'));
}

// Health check route
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: config.env
    });
});

app.get('/delete-account', (_req: Request, res: Response) => {
    res.type('html').send(getDeleteAccountPage(getSupportEmail()));
});

app.post('/delete-account', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const supportEmail = getSupportEmail();
        const email = String(req.body.email || '').trim().toLowerCase();
        const details = String(req.body.details || '').trim();

        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            res.status(400).type('html').send(
                getDeleteAccountPage(supportEmail, 'Please enter a valid account email address.')
            );
            return;
        }

        await sendEmail({
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

        res.type('html').send(
            getDeleteAccountPage(
                supportEmail,
                'Your deletion request was submitted. We will verify ownership and complete eligible deletion requests within 30 days.'
            )
        );
    } catch (error) {
        next(error);
    }
});

app.get('/api/v1/auth/delete-account', (_req: Request, res: Response) => {
    res.redirect(302, '/delete-account');
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/provider', providerRoutes);
app.use('/api/v1', providerOnboardingRoutes); // routes internally use /auth/provider/* and /provider/onboarding/*
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/foods', foodRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/customer/orders', customerOrderRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/admin/reviews', reviewRoutes); // Alias for admin dashboard
app.use('/api/v1/favorites', favoriteRoutes);
app.use('/api/v1/feed', feedRoutes);
app.use('/api/v1/top-rated', topRatedRoutes);
app.use('/api/v1/admin/top', topRatedRoutes); // Alias for admin dashboard
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/payment-methods', paymentMethodRoutes);
app.use('/api/v1/stripe', stripeRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/states', stateRoutes);
app.use('/api/v1/banners', bannerRoutes);
app.use('/api/v1/admin/banners', bannerRoutes); // Alias for admin dashboard
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/support-tickets', supportTicketRoutes);
app.use('/api/v1/support', supportTicketRoutes); // Alternative route for frontend
app.use('/api/v1/compliance', complianceRoutes);
app.use('/api/v1/oauth', oauthRoutes);
app.use('/api/auth', oauthRoutes); // Google OAuth legacy route
app.use('/api/v1/donation', mealTokenRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/activities', activityRoutes);

// Admin routes - specific routes FIRST, broad /admin mounts LAST
app.use('/api/v1/admin/analytics', adminAnalyticsRoutes);
app.use('/api/v1/admin/dashboard', adminAnalyticsRoutes); // analytics via dashboard prefix
app.use('/api/v1/admin/users', adminUserRoutes);
app.use('/api/v1/admin/orders', adminOrderRoutes);
app.use('/api/v1/admin/transactions', adminTransactionRoutes);
app.use('/api/v1/admin/transactions-orders', adminTransactionRoutes); // Alias for frontend compatibility
app.use('/api/v1/admin/customers', adminCustomerRoutes);
app.use('/api/v1/admin/tax', adminTaxRoutes);
app.use('/api/v1/admin/payment-methods', adminPaymentMethodRoutes);
app.use('/api/v1/admin/legal', adminLegalDocumentRoutes);
app.use('/api/v1/config', systemConfigRoutes); // Public config routes: /logo, /public, /platform-fee
app.use('/api/v1/admin/config', systemConfigRoutes);
app.use('/api/v1/admin/notifications', adminNotificationRoutes);
app.use('/api/v1/admin/donation', adminMealTokenRoutes);
app.use('/api/v1/admin/payouts', adminPayoutRoutes);
// Broad /api/v1/admin mounts MUST come LAST
app.use('/api/v1/admin', adminAnalyticsRoutes);   // covers /top-restaurants, /trending-menus etc.
app.use('/api/v1/admin', adminDashboardRoutes);   // covers /feedback, /detailed-stats, /reviews
app.use('/api/v1/admin', adminRestaurantRoutes);  // covers /restaurants/:id, /dashboard/stats/:id

// 404 handler - catch all unmatched routes
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        errorCode: 'ROUTE_NOT_FOUND'
    });
});

// Global error handler
app.use(errorMiddleware);

export default app;
