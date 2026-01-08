import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { startShift, endShift, getShiftStatus } from '../controllers/shiftController';

const router = Router();

router.use(authMiddleware);

router.post('/start', startShift);
router.post('/end', endShift);
router.get('/status', getShiftStatus);

export default router;
