import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getDelivery, updateDeliveryStatus } from '../controllers/deliveryController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/:id', getDelivery);
router.put('/:id/status', updateDeliveryStatus);

export default router;
