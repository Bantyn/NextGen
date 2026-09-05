import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import connectDB from './utils/db.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import apiRoutes from './routes/index.js';

dotenv.config();

const app = express();

// Initialize MongoDB Connection Pool
connectDB();

const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.resolve('uploads')));

// Health & Diagnostics Endpoint
app.get('/api/v1/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'success',
    message: 'MediKiosk Patient Tracking Server is running on network',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      name: mongoose.connection.name || 'medikiosk_patient_tracking',
    },
  });
});

// Centralized API v1 Routes
app.use('/api/v1', apiRoutes);

// Catch 404 Route Not Found
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, HOST, () => {
    logger.info(`Server listening on network: http://${HOST}:${PORT}`);
  });
}

// Global Process Crash Protection
process.on('uncaughtException', (err) => {
  logger.error('[Global Uncaught Exception]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('[Global Unhandled Rejection]:', reason);
});

export default app;
