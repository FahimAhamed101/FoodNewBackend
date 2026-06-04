import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { UserRole } from '../models/user.model';
import adminDashboardController from '../controllers/adminDashboard.controller';
import reviewController from '../controllers/review.controller';
import adminAnalyticsController from '../controllers/adminAnalytics.controller';

const router = Router();

// Secure all routes with JWT and Admin Role
router.use(authenticate);
router.use(requireRole([UserRole.ADMIN]));
router.get('/analytics', adminDashboardController.getAnalytics);
router.get('/feedback', adminDashboardController.getFeedback);
router.get('/top-restaurants', adminDashboardController.getTopRestaurants);

/**
 * 4️⃣ API 4: Dashboard Detailed Stats (for charts)
 * GET /api/admin/detailed-stats?timeRange=today|week|month|year
 */
router.get('/detailed-stats', adminDashboardController.getDetailedStats);

/**
 * 5️⃣ API 5: All Reviews (Platform-wide)
 * GET /api/v1/admin/reviews
 */
router.get('/reviews', reviewController.getAllReviews);

/**
 * 6️⃣ API 6: Trending Menu Items
 * GET /api/v1/admin/dashboard/trending-menu
 * Alias for /api/v1/admin/analytics/trending-menus
 */
router.get('/trending-menu', adminAnalyticsController.getTrendingMenus);

export default router;
