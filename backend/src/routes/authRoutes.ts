import { Router } from 'express';
import { login, createDriver } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/register', createDriver);

export default router;
