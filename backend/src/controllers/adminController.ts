import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

// ============ ADMIN AUTH ============

// Admin login (using environment variables for now, can be extended to DB)
export const adminLogin = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        // Check against environment variables (simple approach)
        const adminUser = process.env.ADMIN_USERNAME || 'admin';
        const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

        if (username !== adminUser || password !== adminPass) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate admin JWT token
        const token = jwt.sign(
            { role: 'admin', username },
            process.env.JWT_SECRET!,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            admin: { username, role: 'admin' }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ============ DASHBOARD STATS ============

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get counts
        const [
            totalDrivers,
            activeDrivers,
            totalRoutes,
            todayRoutes,
            totalDeliveries,
            todayDeliveries,
            pendingReports
        ] = await Promise.all([
            prisma.driver.count(),
            prisma.driver.count({ where: { status: 'ACTIVE' } }),
            prisma.route.count(),
            prisma.route.count({ where: { date: { gte: today } } }),
            prisma.delivery.count(),
            prisma.delivery.count({ where: { createdAt: { gte: today } } }),
            prisma.report.count({ where: { status: 'PENDING' } })
        ]);

        // Delivery stats
        const deliveryStats = await prisma.delivery.groupBy({
            by: ['status'],
            _count: { id: true }
        });

        const delivered = deliveryStats.find(s => s.status === 'DELIVERED')?._count.id || 0;
        const attempted = deliveryStats.find(s => s.status === 'ATTEMPTED')?._count.id || 0;
        const pending = deliveryStats.find(s => s.status === 'PENDING')?._count.id || 0;

        // COD collected today
        const codToday = await prisma.delivery.aggregate({
            where: {
                status: 'DELIVERED',
                deliveredAt: { gte: today }
            },
            _sum: { codAmount: true }
        });

        res.json({
            drivers: {
                total: totalDrivers,
                active: activeDrivers
            },
            routes: {
                total: totalRoutes,
                today: todayRoutes
            },
            deliveries: {
                total: totalDeliveries,
                today: todayDeliveries,
                delivered,
                attempted,
                pending
            },
            reports: {
                pending: pendingReports
            },
            cod: {
                collectedToday: codToday._sum.codAmount || 0
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ============ DRIVERS CRUD ============

export const getAllDrivers = async (req: Request, res: Response) => {
    try {
        console.log('Getting all drivers...');

        const drivers = await prisma.driver.findMany();

        console.log('Found drivers:', drivers.length);

        // Remove password from response
        const driversWithoutPassword = drivers.map(({ password, ...rest }) => rest);

        res.json(driversWithoutPassword);
    } catch (error: any) {
        console.error('Get all drivers error:', error.message);
        console.error('Full error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const getDriverById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const driver = await prisma.driver.findUnique({
            where: { id: parseInt(id) },
            include: {
                routes: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        deliveries: {
                            select: { id: true, status: true }
                        }
                    }
                },
                reports: {
                    take: 5,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        // Remove password from response
        const { password, ...driverData } = driver;

        res.json(driverData);
    } catch (error) {
        console.error('Get driver by id error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createDriver = async (req: Request, res: Response) => {
    try {
        const { username, password, fullName, email, phone, vehicleNumber, emiratesId, licenseNo } = req.body;

        if (!username || !password || !fullName) {
            return res.status(400).json({ error: 'Username, password, and full name are required' });
        }

        // Check if username already exists
        const existing = await prisma.driver.findUnique({ where: { username } });
        if (existing) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const driver = await prisma.driver.create({
            data: {
                username,
                password: hashedPassword,
                fullName,
                email,
                phone,
                vehicleNumber,
                emiratesId,
                licenseNo
            }
        });

        const { password: _, ...driverData } = driver;
        res.status(201).json(driverData);
    } catch (error) {
        console.error('Create driver error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateDriver = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { fullName, email, phone, vehicleNumber, emiratesId, licenseNo, status } = req.body;

        const driver = await prisma.driver.update({
            where: { id: parseInt(id) },
            data: {
                fullName,
                email,
                phone,
                vehicleNumber,
                emiratesId,
                licenseNo,
                status
            }
        });

        const { password, ...driverData } = driver;
        res.json(driverData);
    } catch (error) {
        console.error('Update driver error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteDriver = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const driverId = parseInt(id);

        // Check if driver has any routes assigned
        const routesCount = await prisma.route.count({
            where: { driverId }
        });

        if (routesCount > 0) {
            return res.status(400).json({
                error: `Cannot delete driver. They have ${routesCount} route(s) assigned. Please reassign or delete routes first.`
            });
        }

        // Check for reports
        const reportsCount = await prisma.report.count({
            where: { driverId }
        });

        if (reportsCount > 0) {
            return res.status(400).json({
                error: `Cannot delete driver. They have ${reportsCount} report(s). Please delete reports first.`
            });
        }

        await prisma.driver.delete({
            where: { id: driverId }
        });

        res.json({ message: 'Driver deleted successfully' });
    } catch (error: any) {
        console.error('Delete driver error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete driver' });
    }
};

// ============ ROUTES MANAGEMENT ============

export const getAllRoutes = async (req: Request, res: Response) => {
    try {
        console.log('Getting all routes...');

        const routes = await prisma.route.findMany({
            include: {
                driver: {
                    select: { id: true, fullName: true, vehicleNumber: true }
                },
                deliveries: {
                    select: {
                        id: true,
                        status: true,
                        codAmount: true,
                        customerName: true,
                        address: true
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        console.log('Found routes:', routes.length);

        res.json(routes);
    } catch (error: any) {
        console.error('Get all routes error:', error.message);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const getRouteDetails = async (req: Request, res: Response) => {
    try {
        const { routeId } = req.params;

        const route = await prisma.route.findUnique({
            where: { id: routeId },
            include: {
                driver: {
                    select: { id: true, fullName: true, phone: true, vehicleNumber: true }
                },
                deliveries: {
                    orderBy: { id: 'asc' }
                }
            }
        });

        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }

        res.json(route);
    } catch (error: any) {
        console.error('Get route details error:', error.message);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const createRoute = async (req: Request, res: Response) => {
    try {
        const { id, driverId, date, zone, vehicleInfo, deliveries } = req.body;

        if (!id || !date) {
            return res.status(400).json({ error: 'Route ID and date are required' });
        }

        const routeData: any = {
            id,
            date: new Date(date),
            zone,
            vehicleInfo,
        };

        // Only add driverId if provided
        if (driverId) {
            routeData.driverId = parseInt(driverId);
        }

        // Add deliveries if provided
        if (deliveries && deliveries.length > 0) {
            routeData.deliveries = {
                create: deliveries.map((d: any) => ({
                    customerName: d.customerName,
                    customerPhone: d.customerPhone,
                    address: d.address,
                    latitude: d.latitude,
                    longitude: d.longitude,
                    packageRef: d.packageRef,
                    weight: d.weight,
                    dimensions: d.dimensions,
                    type: d.type || 'PREPAID',
                    codAmount: d.codAmount || 0
                }))
            };
        }

        const route = await prisma.route.create({
            data: routeData,
            include: { deliveries: true }
        });

        res.status(201).json(route);
    } catch (error: any) {
        console.error('Create route error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const updateRouteStatus = async (req: Request, res: Response) => {
    try {
        const { routeId } = req.params;
        const { status } = req.body;

        const route = await prisma.route.update({
            where: { id: routeId },
            data: { status }
        });

        res.json(route);
    } catch (error) {
        console.error('Update route status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ============ DELIVERIES VIEW ============

export const getAllDeliveries = async (req: Request, res: Response) => {
    try {
        const { status, routeId, date } = req.query;

        const where: any = {};

        if (status) where.status = status;
        if (routeId) where.routeId = routeId;

        if (date) {
            const targetDate = new Date(date as string);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);
            where.createdAt = { gte: targetDate, lt: nextDay };
        }

        const deliveries = await prisma.delivery.findMany({
            where,
            include: {
                route: {
                    include: {
                        driver: {
                            select: { id: true, fullName: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(deliveries);
    } catch (error) {
        console.error('Get all deliveries error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ============ REPORTS MANAGEMENT ============

export const getAllReports = async (req: Request, res: Response) => {
    try {
        const { status, driverId } = req.query;

        console.log('Getting all reports with filters:', { status, driverId });

        const where: any = {};

        if (status) where.status = status;
        if (driverId) where.driverId = parseInt(driverId as string);

        const reports = await prisma.report.findMany({
            where,
            include: {
                driver: {
                    select: { id: true, fullName: true, phone: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`Found ${reports.length} reports`);

        res.json(reports);
    } catch (error) {
        console.error('Get all reports error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateReportStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const report = await prisma.report.update({
            where: { id: parseInt(id) },
            data: {
                status,
                resolvedAt: status === 'RESOLVED' ? new Date() : null
            }
        });

        res.json(report);
    } catch (error) {
        console.error('Update report status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
