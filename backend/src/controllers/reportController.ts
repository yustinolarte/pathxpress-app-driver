import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import cloudinary from '../config/cloudinary';

export const createReport = async (req: AuthRequest, res: Response) => {
    try {
        const driverId = req.driverId!;
        const {
            issueType,
            notes,
            photo,
            location
        } = req.body;

        if (!issueType) {
            return res.status(400).json({ error: 'Issue type is required' });
        }

        let photoUrl: string | undefined;

        // Upload photo to Cloudinary if provided
        if (photo) {
            try {
                const uploadResult = await cloudinary.uploader.upload(photo, {
                    folder: 'pathxpress/reports',
                    resource_type: 'image'
                });
                photoUrl = uploadResult.secure_url;
            } catch (uploadError: any) {
                console.error('Photo upload error:', uploadError);
                return res.status(500).json({
                    error: `Failed to upload photo: ${uploadError.message || JSON.stringify(uploadError)}`
                });
            }
        }

        const report = await prisma.report.create({
            data: {
                driverId,
                issueType,
                description: notes,
                photoUrl,
                latitude: location?.latitude,
                longitude: location?.longitude,
                accuracy: location?.accuracy
            }
        });

        res.status(201).json({
            message: 'Report created successfully',
            report
        });
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getDriverReports = async (req: AuthRequest, res: Response) => {
    try {
        const driverId = req.driverId!;
        const { status } = req.query;

        const where: any = { driverId };

        if (status) {
            where.status = status;
        }

        const reports = await prisma.report.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        res.json(reports);
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getReport = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const driverId = req.driverId;

        const report = await prisma.report.findUnique({
            where: { id: parseInt(id) }
        });

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        if (report.driverId !== driverId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(report);
    } catch (error) {
        console.error('Get report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
