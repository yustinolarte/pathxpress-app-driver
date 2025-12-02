import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { createReport, getDriverReports, getReport } from '../controllers/reportController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/', createReport);
router.get('/', getDriverReports);
router.get('/:id', getReport);

export default router;
