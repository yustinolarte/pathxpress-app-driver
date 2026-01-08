import { Request, Response } from 'express';
import prisma from '../config/database';

export const startShift = async (req: Request, res: Response) => {
    try {
        const driverId = (req as any).driverId;

        // Check if there's an active shift
        const activeShift = await prisma.shift.findFirst({
            where: {
                driverId: Number(driverId),
                endTime: null
            }
        });

        if (activeShift) {
            return res.json(activeShift);
        }

        const shift = await prisma.shift.create({
            data: {
                driverId: Number(driverId),
                startTime: new Date()
            }
        });

        res.json(shift);
    } catch (error) {
        console.error('Start shift error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const endShift = async (req: Request, res: Response) => {
    try {
        const driverId = (req as any).driverId;

        const activeShift = await prisma.shift.findFirst({
            where: {
                driverId: Number(driverId),
                endTime: null
            }
        });

        if (!activeShift) {
            return res.status(404).json({ error: 'No active shift found' });
        }

        const shift = await prisma.shift.update({
            where: { id: activeShift.id },
            data: {
                endTime: new Date()
            }
        });

        res.json(shift);
    } catch (error) {
        console.error('End shift error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getShiftStatus = async (req: Request, res: Response) => {
    try {
        const driverId = (req as any).driverId;

        const activeShift = await prisma.shift.findFirst({
            where: {
                driverId: Number(driverId),
                endTime: null
            },
            include: {
                breaks: true
            }
        });

        res.json({
            isOnDuty: !!activeShift,
            shift: activeShift
        });
    } catch (error) {
        console.error('Get shift status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
