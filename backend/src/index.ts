// Updated for CORS fix - Dec 3, 2025
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import routeRoutes from './routes/routeRoutes';
import deliveryRoutes from './routes/deliveryRoutes';
import reportRoutes from './routes/reportRoutes';
import driverRoutes from './routes/driverRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' })); // For base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/driver', driverRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'PathXpress Driver API is running', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
// Start server only if not running in Vercel (Vercel handles this automatically)
if (process.env.NODE_ENV !== 'production') {
    app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
}

export default app;
