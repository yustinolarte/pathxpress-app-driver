import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AdminRequest extends Request {
    admin?: {
        username: string;
        role: string;
    };
}

export const adminAuth = (req: AdminRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        // Verify this is an admin token
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        req.admin = {
            username: decoded.username,
            role: decoded.role
        };

        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
