import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import connectDB from './utils/db.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import { requestLogger } from './middleware/requestLoggerMiddleware.js';
import apiRoutes from './routes/index.js';

dotenv.config();

// Ensure unbuffered, real-time stdout/stderr flushing to terminal and daemon logs
try {
  if (process.stdout._handle?.setBlocking) process.stdout._handle.setBlocking(true);
  if (process.stderr._handle?.setBlocking) process.stderr._handle.setBlocking(true);
} catch {}

const app = express();

// Initialize MongoDB Connection Pool
connectDB();

// Robust, Enterprise CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Reflect origin dynamically to ensure compatibility with credentials: true
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Message-ID',
    'x-message-id',
    'X-Turn-ID',
    'x-turn-id',
    'X-Session-ID',
    'x-session-id',
    'X-User-ID',
    'x-user-id',
    'X-Role',
    'x-role',
    'Cache-Control',
    'Pragma',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'X-Total-Count', 'X-Message-ID', 'X-Turn-ID'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Apply CORS
app.use(cors(corsOptions));

// Explicit fallback header reflection to ensure zero custom headers are ever blocked
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');

  const reqHeaders = req.headers['access-control-request-headers'];
  if (reqHeaders) {
    res.header('Access-Control-Allow-Headers', reqHeaders);
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// High-Visibility API Request & Response Console Logger
app.use(requestLogger);

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
    console.log(`\n\x1b[32m🚀 [MediKiosk Server Online]\x1b[0m Listening on http://${HOST}:${PORT}`);
    console.log(`\x1b[90m   API Endpoint:\x1b[0m http://localhost:${PORT}/api/v1`);
    console.log(`\x1b[90m   CORS Policy:\x1b[0m Configured with credentials & dynamic header reflection (X-Message-ID allowed)\n`);
    logger.info(`Server listening on network: http://${HOST}:${PORT}`);
  });
}

// Global Process Crash Protection & Console Logging
process.on('uncaughtException', (err) => {
  console.error('\n\x1b[31m💥 [GLOBAL UNCAUGHT EXCEPTION]:\x1b[0m', err.message);
  if (err.stack) console.error(err.stack);
  logger.error('[Global Uncaught Exception]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n\x1b[31m💥 [GLOBAL UNHANDLED REJECTION]:\x1b[0m', reason);
  logger.error('[Global Unhandled Rejection]:', reason);
});

export default app;
