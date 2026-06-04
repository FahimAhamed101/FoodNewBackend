import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import config from './config';
import errorMiddleware from './middlewares/errorMiddleware';

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
