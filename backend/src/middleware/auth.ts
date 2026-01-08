import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    driverId?: number;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not defined!');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: number };
        req.driverId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
