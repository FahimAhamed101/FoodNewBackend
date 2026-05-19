import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { UserRole } from '../models/user.model';
import mealTokenController from '../controllers/mealToken.controller';

const router = Router();

// Protect all routes - Admin only
router.use(authenticate);
router.use(requireRole([UserRole.ADMIN]));

/**
 * GET /api/v1/admin/donation/tokens
 * Query: ?status=available&page=1&limit=20
 * Admin sees all tokens with filters
 */
router.get('/tokens', mealTokenController.adminGetAllTokens);

export default router;
