import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find driver
        const driver = await prisma.driver.findUnique({
            where: { username }
        });

        if (!driver) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, driver.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if driver is active
        if (driver.status !== 'ACTIVE') {
            return res.status(403).json({ error: 'Account is not active' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: driver.id, username: driver.username },
            process.env.JWT_SECRET!,
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
        );

        // Return user info and token
        res.json({
            token,
            driver: {
                id: driver.id,
                username: driver.username,
                fullName: driver.fullName,
                email: driver.email,
                phone: driver.phone,
                vehicleNumber: driver.vehicleNumber
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createDriver = async (req: Request, res: Response) => {
    try {
        const { username, password, fullName, email, phone, vehicleNumber } = req.body;

        if (!username || !password || !fullName) {
            return res.status(400).json({ error: 'Username, password, and full name are required' });
        }

        // Check if username already exists
        const existing = await prisma.driver.findUnique({
            where: { username }
        });

        if (existing) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create driver
        const driver = await prisma.driver.create({
            data: {
                username,
                password: hashedPassword,
                fullName,
                email,
                phone,
                vehicleNumber
            }
        });

        res.status(201).json({
            message: 'Driver created successfully',
            driver: {
                id: driver.id,
                username: driver.username,
                fullName: driver.fullName
            }
        });
    } catch (error) {
        console.error('Create driver error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
