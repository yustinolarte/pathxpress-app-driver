import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getDriverProfile = async (req: AuthRequest, res: Response) => {
    try {
        const driverId = req.driverId;

        console.log('Getting profile for driver:', driverId);

        if (!driverId) {
            return res.status(401).json({ error: 'Driver ID not found in token' });
        }

        // Get driver details
        const driver = await prisma.driver.findUnique({
            where: { id: driverId },
            select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
                phone: true,
                vehicleNumber: true,
                photoUrl: true,
                emiratesId: true,
                emiratesIdExp: true,
                licenseNo: true,
                licenseExp: true,
                status: true,
                createdAt: true
            }
        });

        if (!driver) {
            console.log('Driver not found for id:', driverId);
            return res.status(404).json({ error: 'Driver not found' });
        }

        console.log('Driver found:', driver.fullName);

        // Calculate Metrics for Today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaysDeliveries = await prisma.delivery.findMany({
            where: {
                route: {
                    driverId: driverId,
                    date: {
                        gte: today
                    }
                }
            }
        });

        const totalAssigned = todaysDeliveries.length;
        const completed = todaysDeliveries.filter(d => d.status === 'DELIVERED').length;
        const failed = todaysDeliveries.filter(d => ['ATTEMPTED', 'RETURNED', 'CANCELLED'].includes(d.status)).length;

        // Calculate Efficiency
        const efficiency = totalAssigned > 0
            ? Math.round((completed / totalAssigned) * 100)
            : 100;

        // Calculate Hours Worked (First activity to Last activity)
        // In a real app, you'd track login/logout or route start/end times
        // For now, we'll estimate based on delivery timestamps if available
        let hoursWorked = 0;
        const timestamps = todaysDeliveries
            .map(d => d.updatedAt.getTime())
            .filter(t => t > today.getTime())
            .sort((a, b) => a - b);

        if (timestamps.length > 1) {
            const first = timestamps[0];
            const last = timestamps[timestamps.length - 1];
            hoursWorked = Number(((last - first) / (1000 * 60 * 60)).toFixed(1));
        }

        res.json({
            driver,
            metrics: {
                totalDeliveries: completed,
                efficiency: `${efficiency}%`,
                hoursWorked: hoursWorked,
                rating: 4.8 // Mock rating for now, could be stored in DB
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

export const updateDriverProfile = async (req: AuthRequest, res: Response) => {
    try {
        const driverId = req.driverId;
        const { phone, vehicleNumber, photoUrl } = req.body;

        if (!driverId) {
            return res.status(401).json({ error: 'Driver ID not found in token' });
        }

        const updatedDriver = await prisma.driver.update({
            where: { id: driverId },
            data: {
                phone,
                vehicleNumber,
                photoUrl
            }
        });

        res.json(updatedDriver);
    } catch (error: any) {
        console.error('Update profile error:', error?.message || error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};
