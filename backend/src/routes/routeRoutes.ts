import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getRoute, getDriverRoutes, updateRouteStatus, claimRoute } from '../controllers/routeController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', getDriverRoutes);
router.get('/:routeId', getRoute);
router.post('/:routeId/claim', claimRoute);  // Scan QR to claim/assign route
router.put('/:routeId/status', updateRouteStatus);

export default router;
