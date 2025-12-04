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

        // Verify this delivery belongs to the authenticated driver (or route is unassigned)
        if (delivery.route.driverId !== null && delivery.route.driverId !== driverId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(delivery);
    } catch (error: any) {
        console.error('Get delivery error:', error?.message || error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateDeliveryStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, notes, photoBase64 } = req.body;
        const driverId = req.driverId;

        console.log(`Updating delivery ${id} to status ${status} by driver ${driverId}`);

        const delivery = await prisma.delivery.findUnique({
            where: { id: parseInt(id) },
            include: { route: true }
        });

        if (!delivery) {
            return res.status(404).json({ error: 'Delivery not found' });
        }

        // Check if route is assigned to this driver (or not assigned yet)
        if (delivery.route.driverId !== null && delivery.route.driverId !== driverId) {
            return res.status(403).json({ error: 'This delivery belongs to another driver' });
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
            } catch (uploadError: any) {
                console.error('Photo upload error:', uploadError?.message || uploadError);
                // Continue without photo if upload fails
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

        console.log(`Delivery ${id} updated successfully to ${status}`);

        res.json(updated);
    } catch (error: any) {
        console.error('Update delivery error:', error?.message || error);
        res.status(500).json({ error: error?.message || 'Failed to update delivery' });
    }
};
