import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import cloudinary from '../config/cloudinary';

export const getDelivery = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const driverId = req.driverId;

        const delivery = await prisma.delivery.findUnique({
            where: { id: parseInt(id) },
            include: {
                route: true
            }
        });

        if (!delivery) {
            return res.status(404).json({ error: 'Delivery not found' });
        }

        // Verify this delivery belongs to the authenticated driver
        if (delivery.route.driverId !== driverId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(delivery);
    } catch (error) {
        console.error('Get delivery error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateDeliveryStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, notes, photoBase64 } = req.body;
        const driverId = req.driverId;

        const delivery = await prisma.delivery.findUnique({
            where: { id: parseInt(id) },
            include: { route: true }
        });

        if (!delivery) {
            return res.status(404).json({ error: 'Delivery not found' });
        }

        if (delivery.route.driverId !== driverId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        let photoUrl = delivery.proofPhotoUrl;

        // Upload proof photo if provided
        if (photoBase64) {
            try {
                const uploadResult = await cloudinary.uploader.upload(photoBase64, {
                    folder: 'pathxpress/deliveries',
                    resource_type: 'image'
                });
                photoUrl = uploadResult.secure_url;
            } catch (uploadError) {
                console.error('Photo upload error:', uploadError);
                return res.status(500).json({ error: 'Failed to upload photo' });
            }
        }

        const updateData: any = {
            status,
            notes,
            proofPhotoUrl: photoUrl
        };

        if (status === 'DELIVERED') {
            updateData.deliveredAt = new Date();
        } else if (status === 'ATTEMPTED') {
            updateData.attemptedAt = new Date();
        }

        const updated = await prisma.delivery.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        res.json(updated);
    } catch (error) {
        console.error('Update delivery error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
