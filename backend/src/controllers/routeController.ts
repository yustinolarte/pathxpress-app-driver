import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const getRoute = async (req: AuthRequest, res: Response) => {
    try {
        const { routeId } = req.params;
        const driverId = req.driverId;

        const route = await prisma.route.findUnique({
            where: { id: routeId },
            include: {
                deliveries: {
                    orderBy: { id: 'asc' }
                }
            }
        });

        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }

        // If route is unassigned, allow access (driver can claim it)
        // If route is assigned, verify it belongs to this driver
        if (route.driverId !== null && route.driverId !== driverId) {
            return res.status(403).json({ error: 'This route is assigned to another driver' });
        }

        res.json(route);
    } catch (error) {
        console.error('Get route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Claim/assign an unassigned route to the authenticated driver
export const claimRoute = async (req: AuthRequest, res: Response) => {
    try {
        const { routeId } = req.params;
        const driverId = req.driverId!;

        const route = await prisma.route.findUnique({
            where: { id: routeId },
            include: {
                deliveries: {
                    orderBy: { id: 'asc' }
                }
            }
        });

        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }

        // Check if route is already completed
        if (route.status === 'COMPLETED') {
            return res.status(400).json({ error: 'This route is already completed and cannot be claimed' });
        }

        // Check if route is already assigned
        if (route.driverId !== null) {
            if (route.driverId === driverId) {
                // Already assigned to this driver, just return it
                return res.json(route);
            }
            return res.status(403).json({ error: 'This route is already assigned to another driver' });
        }

        // Assign the route to this driver
        const updatedRoute = await prisma.route.update({
            where: { id: routeId },
            data: {
                driverId: driverId,
                status: 'IN_PROGRESS'
            },
            include: {
                deliveries: {
                    orderBy: { id: 'asc' }
                }
            }
        });

        console.log(`Route ${routeId} claimed by driver ${driverId}`);

        res.json(updatedRoute);
    } catch (error) {
        console.error('Claim route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getDriverRoutes = async (req: AuthRequest, res: Response) => {
    try {
        const driverId = req.driverId!;
        const { status, date } = req.query;

        const where: any = { driverId };

        if (status) {
            where.status = status;
        }

        if (date) {
            const targetDate = new Date(date as string);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);

            where.date = {
                gte: targetDate,
                lt: nextDay
            };
        }

        const routes = await prisma.route.findMany({
            where,
            include: {
                deliveries: {
                    select: {
                        id: true,
                        status: true,
                        codAmount: true
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        res.json(routes);
    } catch (error) {
        console.error('Get driver routes error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateRouteStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { routeId } = req.params;
        const { status } = req.body;
        const driverId = req.driverId;

        console.log(`Updating route ${routeId} to status ${status} by driver ${driverId}`);

        // Verify route exists
        const route = await prisma.route.findUnique({
            where: { id: routeId }
        });

        if (!route) {
            console.log(`Route ${routeId} not found`);
            return res.status(404).json({ error: 'Route not found' });
        }

        // Allow if route belongs to this driver OR if route is unassigned (null driverId)
        if (route.driverId !== null && route.driverId !== driverId) {
            console.log(`Access denied: Route belongs to driver ${route.driverId}, not ${driverId}`);
            return res.status(403).json({ error: 'Access denied' });
        }

        const updatedRoute = await prisma.route.update({
            where: { id: routeId },
            data: { status }
        });

        console.log(`Route ${routeId} updated to ${status}`);

        res.json(updatedRoute);
    } catch (error: any) {
        console.error('Update route status error:', error?.message || error);
        res.status(500).json({ error: error?.message || 'Internal server error' });
    }
};
