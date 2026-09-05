import mongoose from 'mongoose';
import { logger } from './logger.js';

/**
 * Initialize MongoDB connection pool with auto-reconnect and lifecycle event handlers
 */
export const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medikiosk_patient_tracking';
    const conn = await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB Connected successfully to database: ${conn.connection.name} on ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error('Failed to establish MongoDB connection on startup:', error);
    // Don't kill process immediately in development so server can serve static/health with degraded state
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

mongoose.connection.on('connected', () => {
  logger.info('[Mongoose]: Connection established');
});

mongoose.connection.on('error', (err) => {
  logger.error('[Mongoose]: Connection error encountered:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('[Mongoose]: Connection disconnected. Retrying...');
});

// Graceful termination handling
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('[Mongoose]: Connection gracefully closed due to application termination (SIGINT)');
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  try {
    await mongoose.connection.close();
    logger.info('[Mongoose]: Connection gracefully closed due to application termination (SIGTERM)');
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
});

export default connectDB;
