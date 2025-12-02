import express from 'express';
import { getDriverProfile, updateDriverProfile } from '../controllers/driverController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/profile', authMiddleware, getDriverProfile);
router.put('/profile', authMiddleware, updateDriverProfile);

export default router;
