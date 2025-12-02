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

        // Verify this route belongs to the authenticated driver
        if (route.driverId !== driverId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(route);
    } catch (error) {
        console.error('Get route error:', error);
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

        // Verify route belongs to driver
        const route = await prisma.route.findUnique({
            where: { id: routeId }
        });

        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }

        if (route.driverId !== driverId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updatedRoute = await prisma.route.update({
            where: { id: routeId },
            data: { status }
        });

        res.json(updatedRoute);
    } catch (error) {
        console.error('Update route status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
