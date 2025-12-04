import { Router } from 'express';
import { adminAuth } from '../middleware/adminAuth';
import {
    adminLogin,
    getDashboardStats,
    getAllDrivers,
    getDriverById,
    createDriver,
    updateDriver,
    deleteDriver,
    getAllRoutes,
    createRoute,
    updateRouteStatus,
    getAllDeliveries,
    getAllReports,
    updateReportStatus
} from '../controllers/adminController';

const router = Router();

// Auth (no middleware needed)
router.post('/login', adminLogin);

// Protected routes (require admin auth)
router.use(adminAuth);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Drivers CRUD
router.get('/drivers', getAllDrivers);
router.get('/drivers/:id', getDriverById);
router.post('/drivers', createDriver);
router.put('/drivers/:id', updateDriver);
router.delete('/drivers/:id', deleteDriver);

// Routes management
router.get('/routes', getAllRoutes);
router.post('/routes', createRoute);
router.put('/routes/:routeId/status', updateRouteStatus);

// Deliveries view
router.get('/deliveries', getAllDeliveries);

// Reports management
router.get('/reports', getAllReports);
router.put('/reports/:id/status', updateReportStatus);

export default router;
